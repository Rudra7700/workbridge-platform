'use client'

import { useAuth } from '@/contexts/AuthContext'
import { createClientComponentClient } from '@/lib/supabase-client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Send, ArrowLeft, CheckCircle, DollarSign, Star, UserCheck, XCircle, Briefcase, Clock, Shield } from 'lucide-react'

interface Message {
    id: string
    sender_id: string
    message: string
    created_at: string
}

interface ConversationData {
    id: string
    employer_id: string
    worker_id: string
    status: string
    created_at: string
}

export default function ConversationPage() {
    const { user, profile } = useAuth()
    const router = useRouter()
    const params = useParams()
    const conversationId = params.id as string
    const supabase = createClientComponentClient()
    const bottomRef = useRef<HTMLDivElement>(null)

    const [conversation, setConversation] = useState<ConversationData | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [otherUser, setOtherUser] = useState<{ name: string; rating: number; aadhaar_verified: boolean } | null>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    // Payment modal
    const [showPayment, setShowPayment] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentProcessing, setPaymentProcessing] = useState(false)

    // Rating modal
    const [showRating, setShowRating] = useState(false)
    const [rating, setRating] = useState(5)
    const [reviewComment, setReviewComment] = useState('')

    const isEmployer = profile?.role === 'employer'

    const fetchConversation = useCallback(async () => {
        if (!user) return
        setLoading(true)

        const { data: conv } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .single()

        if (!conv) {
            router.push(profile?.role === 'employer' ? '/employer/dashboard' : '/worker/dashboard')
            return
        }

        setConversation(conv)

        // Get the other user's profile
        const otherId = conv.employer_id === user.id ? conv.worker_id : conv.employer_id
        const { data: otherProfile } = await supabase
            .from('profiles')
            .select('name, rating, aadhaar_verified')
            .eq('id', otherId)
            .single()

        setOtherUser(otherProfile)

        // Fetch messages
        const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })

        setMessages(msgs || [])
        setLoading(false)
    }, [conversationId, user])

    useEffect(() => {
        fetchConversation()
    }, [fetchConversation])

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel(`conversation:${conversationId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
                (payload) => {
                    const newMsg = payload.new as Message
                    setMessages((prev) => {
                        if (prev.some(m => m.id === newMsg.id)) return prev
                        return [...prev, newMsg]
                    })
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${conversationId}` },
                (payload) => {
                    setConversation(payload.new as ConversationData)
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [conversationId])

    // Auto scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!newMessage.trim() || !user || sending) return
        setSending(true)

        const { data, error } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: user.id,
            message: newMessage.trim(),
        }).select().single()

        if (error) {
            console.error('Message send error:', JSON.stringify(error, null, 2))
            alert(`Failed to send: ${error.message || error.code || JSON.stringify(error)}`)
        } else if (data) {
            // Add message to local state immediately
            setMessages((prev) => {
                // Avoid duplicates if realtime also fires
                if (prev.some(m => m.id === data.id)) return prev
                return [...prev, data as Message]
            })
            setNewMessage('')
        }
        setSending(false)
    }

    const handleAcceptHire = async () => {
        setActionLoading(true)
        await supabase.from('conversations').update({ status: 'hired' }).eq('id', conversationId)
        setConversation(prev => prev ? { ...prev, status: 'hired' } : null)
        setActionLoading(false)
    }

    const handleDeclineHire = async () => {
        setActionLoading(true)
        await supabase.from('conversations').update({ status: 'completed' }).eq('id', conversationId)
        setConversation(prev => prev ? { ...prev, status: 'completed' } : null)
        setActionLoading(false)
    }

    const handlePayment = async () => {
        if (!paymentAmount || !user) return
        setPaymentProcessing(true)

        // Call fake payment API
        try {
            const response = await fetch('/api/payments/fake-pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    amount: Number(paymentAmount),
                    employer_id: user.id,
                    worker_id: conversation?.worker_id,
                }),
            })

            if (response.ok) {
                setShowPayment(false)
                setPaymentAmount('')
                // Show rating modal after payment
                setShowRating(true)
            }
        } catch (err) {
            console.error('Payment error:', err)
        }
        setPaymentProcessing(false)
    }

    const handleCompleteAndRate = async () => {
        if (!user || !conversation) return
        setActionLoading(true)

        const reviewee_id = isEmployer ? conversation.worker_id : conversation.employer_id

        // Submit review
        await supabase.from('reviews').insert({
            reviewer_id: user.id,
            reviewee_id,
            conversation_id: conversationId,
            rating,
            comment: reviewComment,
        })

        // Update average rating for the reviewee
        const { data: allReviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('reviewee_id', reviewee_id)

        if (allReviews && allReviews.length > 0) {
            const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
            await supabase.from('profiles').update({ rating: Math.round(avgRating * 10) / 10 }).eq('id', reviewee_id)
        }

        // Mark conversation completed
        await supabase.from('conversations').update({ status: 'completed' }).eq('id', conversationId)
        setConversation(prev => prev ? { ...prev, status: 'completed' } : null)
        setShowRating(false)
        setActionLoading(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    const statusColor = {
        pending: 'bg-amber-100 text-amber-700',
        hired: 'bg-blue-100 text-blue-700',
        completed: 'bg-emerald-100 text-emerald-700',
    }[conversation?.status || 'pending']

    return (
        <div className="h-screen flex flex-col bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push(isEmployer ? '/employer/dashboard' : '/worker/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                                {otherUser?.name?.[0] || '?'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="font-semibold text-slate-900">{otherUser?.name || 'User'}</h1>
                                    {otherUser?.aadhaar_verified && (
                                        <Shield className="w-4 h-4 text-emerald-500" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-500" /> {otherUser?.rating || 0}</span>
                                    <span>•</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusColor}`}>
                                        {conversation?.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions based on status and role */}
                    <div className="flex items-center gap-2">
                        {isEmployer && conversation?.status === 'hired' && (
                            <button onClick={() => setShowPayment(true)} className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                                <DollarSign className="w-4 h-4" /> Pay & Complete
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Pending Actions Banner */}
            {conversation?.status === 'pending' && !isEmployer && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-600" />
                            <p className="text-sm text-amber-800 font-medium">This employer wants to hire you</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleAcceptHire} disabled={actionLoading} className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                                <UserCheck className="w-4 h-4" /> Accept
                            </button>
                            <button onClick={handleDeclineHire} disabled={actionLoading} className="flex items-center gap-1.5 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50">
                                <XCircle className="w-4 h-4" /> Decline
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {conversation?.status === 'pending' && isEmployer && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
                    <div className="max-w-4xl mx-auto flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <p className="text-sm text-amber-800 font-medium">Waiting for worker to accept your hire request...</p>
                    </div>
                </div>
            )}

            {conversation?.status === 'completed' && (
                <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-3">
                    <div className="max-w-4xl mx-auto flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <p className="text-sm text-emerald-800 font-medium">This job has been completed</p>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-4xl mx-auto space-y-3">
                    {messages.length === 0 && (
                        <div className="text-center py-12">
                            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400">No messages yet. Say hello!</p>
                        </div>
                    )}
                    {messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${isMe
                                    ? 'bg-blue-600 text-white rounded-br-md'
                                    : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                                    }`}>
                                    <p>{msg.message}</p>
                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Message Input */}
            {conversation?.status !== 'completed' && (
                <div className="bg-white border-t border-slate-200 px-4 py-3">
                    <div className="max-w-4xl mx-auto flex items-center gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none text-sm"
                        />
                        <button onClick={handleSend} disabled={!newMessage.trim() || sending} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPayment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-lg font-bold text-slate-900 mb-1">Pay Worker</h2>
                        <p className="text-sm text-slate-500 mb-4">Enter the payment amount for {otherUser?.name}</p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none text-lg font-semibold"
                                placeholder="500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowPayment(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50">Cancel</button>
                            <button onClick={handlePayment} disabled={paymentProcessing || !paymentAmount} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50">
                                {paymentProcessing ? 'Processing...' : 'Pay Now'}
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-3 text-center">This is a simulated payment for demo purposes</p>
                    </div>
                </div>
            )}

            {/* Rating Modal */}
            {showRating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-lg font-bold text-slate-900 mb-1">Rate {otherUser?.name}</h2>
                        <p className="text-sm text-slate-500 mb-4">How was your experience?</p>
                        <div className="flex justify-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button key={s} onClick={() => setRating(s)} className="p-1">
                                    <Star className={`w-8 h-8 ${s <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none text-sm mb-4 h-24 resize-none"
                            placeholder="Leave a comment (optional)"
                        />
                        <button onClick={handleCompleteAndRate} disabled={actionLoading} className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50">
                            {actionLoading ? 'Submitting...' : 'Submit & Complete'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
