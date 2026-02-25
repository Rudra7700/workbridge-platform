'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClientComponentClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

export interface Profile {
    id: string;
    name: string | null;
    role: 'employer' | 'worker';
    rating: number;
    verified: boolean;
    aadhaar_verified: boolean;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    signUp: (email: string, password: string, name: string, role: 'employer' | 'worker') => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClientComponentClient();

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, role, rating, verified, aadhaar_verified')
                .eq('id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No profile found - user might have signed up via OAuth and skipped callback
                    console.warn(`No profile found for user ${userId}. Attempting to create one...`);

                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const role = user.user_metadata?.role || 'worker';
                        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';

                        const newProfile: Profile = {
                            id: user.id,
                            name,
                            role,
                            rating: 0,
                            verified: false,
                            aadhaar_verified: false,
                        };

                        await supabase.from('profiles').upsert(newProfile);

                        if (role === 'worker') {
                            await supabase.from('worker_profiles').upsert({
                                user_id: user.id,
                                skills: [],
                                experience: 0,
                                wage_expectation: 0,
                                location: '',
                                total_earnings: 0,
                                total_jobs: 0,
                            });
                        }

                        setProfile(newProfile);
                        return newProfile;
                    }

                    setProfile(null);
                    return null;
                }
                throw error;
            }

            if (data) {
                setProfile(data as Profile);
            }
            return data as Profile | null;
        } catch (err) {
            console.error('Error fetching profile:', err);
            setProfile(null);
            return null;
        } finally {
            // Guarantee loading is unlocked
            setLoading(false);
        }
    }, [supabase]);

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    fetchProfile(session.user.id).finally(() => {
                        if (mounted) setLoading(false);
                    });
                } else {
                    setLoading(false);
                }
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                if (!mounted) return;

                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    await fetchProfile(currentSession.user.id);
                } else {
                    setProfile(null);
                }

                // Always unlock loading after any auth state change completes
                setLoading(false);
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabase, fetchProfile]);

    const signUp = async (email: string, password: string, name: string, role: 'employer' | 'worker') => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: { name, role },
            },
        });

        if (error) return { error: error.message };

        if (data.user) {
            // Profile entry creation is handled by the auth callback or here as a fallback
            try {
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    name,
                    role,
                    rating: 0,
                    verified: false,
                    aadhaar_verified: false,
                });

                if (role === 'worker') {
                    await supabase.from('worker_profiles').upsert({
                        user_id: data.user.id,
                        skills: [],
                        experience: 0,
                        wage_expectation: 0,
                        location: '',
                        total_earnings: 0,
                        total_jobs: 0,
                    });
                }
            } catch (err) {
                console.error('Error creating profile during signup:', err);
            }
        }

        return { error: null };
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) return { error: error.message };

        // Redirect is handled by the middleware and AuthContext listener
        return { error: null };
    };

    const signInWithGoogle = async () => {
        // Enforce using the current window origin so local testing doesn't get hijacked by production env vars.
        const siteUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL;
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${siteUrl}/auth/callback`,
            },
        });
    };

    const signOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
        setUser(null);
        setLoading(false);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signInWithGoogle, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
