'use client'

import { useAuth } from '@/contexts/AuthContext'
import { createClientComponentClient } from '@/lib/supabase-client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, CheckCircle, XCircle, FileText, User, RefreshCw } from 'lucide-react'

interface PendingDocument {
    id: string
    user_id: string
    document_url: string
    document_type: string
    created_at: string
    profiles: {
        name: string
        role: string
    }
}

export default function AdminDocumentsPage() {
    const { user, profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const supabase = createClientComponentClient()

    const [documents, setDocuments] = useState<PendingDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    // A simple hackathon check to ensure only the creator/admin can view this list
    // In a real app, 'role' would probably be 'admin', but here we can just protect it
    // based on email or let any authenticated user test it if we want open demo logic.
    // For safety, let's just make sure they are logged in.
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    const fetchPendingDocs = useCallback(async () => {
        setLoading(true)
        // Fetch documents + profile info
        const { data, error } = await supabase
            .from('documents')
            .select('*, profiles!inner(name, role)')
            .eq('verification_status', 'pending')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setDocuments(data as unknown as PendingDocument[])
        } else {
            console.error("Failed to fetch pending docs:", error)
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        if (user) {
            fetchPendingDocs()
        }
    }, [user, fetchPendingDocs])

    const handleAction = async (docId: string, userId: string, action: 'approved' | 'rejected') => {
        setActionLoading(docId)

        try {
            // 1. Update Document Status
            const { error: docError } = await supabase
                .from('documents')
                .update({ verification_status: action })
                .eq('id', docId)

            if (docError) throw docError

            // 2. If Approved, update the user's profile to verified
            if (action === 'approved') {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ aadhaar_verified: true, verified: true })
                    .eq('id', userId)

                if (profileError) throw profileError
            }

            // Remove from local state
            setDocuments(prev => prev.filter(d => d.id !== docId))
        } catch (err) {
            console.error("Action failed:", err)
            alert("Failed to process document. See console.")
        } finally {
            setActionLoading(null)
        }
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
            <div className="max-w-5xl mx-auto">

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <ShieldAlert className="w-6 h-6 text-indigo-600" />
                            Moderation Dashboard
                        </h1>
                        <p className="text-slate-500 mt-1">Review pending identity verifications.</p>
                    </div>
                    <button onClick={fetchPendingDocs} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                {documents.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-slate-900 mb-1">Queue Empty</h2>
                        <p className="text-slate-500">All pending documents have been reviewed.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {documents.map((doc) => (
                            <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <User className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{doc.profiles.name}</p>
                                            <p className="text-xs text-slate-500 capitalize">{doc.profiles.role} • {new Date(doc.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1">
                                        <FileText className="w-3 h-3" /> {doc.document_type}
                                    </span>
                                </div>

                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 mb-4 h-64 relative group flex items-center justify-center">
                                        {/* Simple render logic distinguishing images vs pdfs based on extension hack */}
                                        {doc.document_url.toLowerCase().endsWith('.pdf') ? (
                                            <iframe src={`${doc.document_url}#toolbar=0`} className="w-full h-full" title="Document Viewer" />
                                        ) : (
                                            <img src={doc.document_url} alt="KYC Document" className="w-full h-full object-contain" />
                                        )}
                                        <a href={doc.document_url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium">
                                            Open Full Size
                                        </a>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-auto">
                                        <button
                                            onClick={() => handleAction(doc.id, doc.user_id, 'rejected')}
                                            disabled={actionLoading === doc.id}
                                            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                            <XCircle className="w-4 h-4" /> Reject
                                        </button>
                                        <button
                                            onClick={() => handleAction(doc.id, doc.user_id, 'approved')}
                                            disabled={actionLoading === doc.id}
                                            className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Approve & Verify
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
