import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { CrispConversation, CrispInbox, CrispMessage, CrispApiResponse } from '@/types/crisp'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token ?? ''}`,
  }
}

function parseList<T>(json: unknown): T[] {
  if (Array.isArray(json)) return json as T[]
  const typed = json as CrispApiResponse<T[]>
  if (Array.isArray(typed?.data)) return typed.data
  return []
}

function parseMessages(json: unknown): CrispMessage[] {
  if (Array.isArray(json)) return json as CrispMessage[]
  const typed = json as CrispApiResponse<CrispMessage[] | { messages: CrispMessage[] }>
  const raw = typed?.data
  if (Array.isArray(raw)) return raw
  if (raw && 'messages' in raw && Array.isArray(raw.messages)) return raw.messages
  return []
}

export function useCrisp() {
  const [inboxes, setInboxes] = useState<CrispInbox[]>([])
  const [selectedInbox, setSelectedInbox] = useState<string | null>(null) // null = tous

  const [conversations, setConversations] = useState<CrispConversation[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [messages, setMessages] = useState<CrispMessage[]>([])
  const [isLoadingInboxes, setIsLoadingInboxes] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Inboxes ─────────────────────────────────────────────────────────────
  const fetchInboxes = useCallback(async () => {
    setIsLoadingInboxes(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${BACKEND_URL}/crisp/inboxes`, { headers })
      const json: unknown = await res.json()
      if (res.ok) setInboxes(parseList<CrispInbox>(json))
    } catch {
      // silencieux — non bloquant
    } finally {
      setIsLoadingInboxes(false)
    }
  }, [])

  // ── Conversations ────────────────────────────────────────────────────────
  const fetchConversations = useCallback(async (inboxId: string | null = selectedInbox) => {
    setIsLoadingConversations(true)
    setError(null)
    try {
      const headers = await getAuthHeaders()
      const qs = new URLSearchParams({ page: '1' })
      if (inboxId) qs.set('filter_inbox', inboxId)
      const res = await fetch(`${BACKEND_URL}/crisp/conversations?${qs}`, { headers })
      const json: unknown = await res.json()
      if (!res.ok) {
        const err = json as { message?: string }
        throw new Error(err?.message ?? `Erreur HTTP ${res.status}`)
      }
      const list = parseList<CrispConversation>(json)
      setConversations(list)
      setPage(1)
      setHasMore(list.length === 20)
      setSelectedId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setIsLoadingConversations(false)
    }
  }, [selectedInbox])

  const loadMoreConversations = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    try {
      const nextPage = page + 1
      const headers = await getAuthHeaders()
      const qs = new URLSearchParams({ page: String(nextPage) })
      if (selectedInbox) qs.set('filter_inbox', selectedInbox)
      const res = await fetch(`${BACKEND_URL}/crisp/conversations?${qs}`, { headers })
      const json: unknown = await res.json()
      if (!res.ok) {
        const err = json as { message?: string }
        throw new Error(err?.message ?? `Erreur HTTP ${res.status}`)
      }
      const list = parseList<CrispConversation>(json)
      setConversations(prev => [...prev, ...list])
      setPage(nextPage)
      setHasMore(list.length === 20)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setIsLoadingMore(false)
    }
  }, [page, hasMore, isLoadingMore, selectedInbox])

  // Changer d'inbox → recharge les conversations
  const switchInbox = useCallback((inboxId: string | null) => {
    setSelectedInbox(inboxId)
    void fetchConversations(inboxId)
  }, [fetchConversations])

  // ── Messages ─────────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (sessionId: string) => {
    setIsLoadingMessages(true)
    setMessages([])
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(
        `${BACKEND_URL}/crisp/messages?session_id=${encodeURIComponent(sessionId)}`,
        { headers },
      )
      const json: unknown = await res.json()
      if (!res.ok) {
        const err = json as { message?: string }
        throw new Error(err?.message ?? `Erreur HTTP ${res.status}`)
      }
      setMessages(parseMessages(json))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setIsLoadingMessages(false)
    }
  }, [])

  const markAsRead = useCallback(async (sessionId: string) => {
    try {
      const headers = await getAuthHeaders()
      await fetch(`${BACKEND_URL}/crisp/read`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ session_id: sessionId }),
      })
      setConversations(prev =>
        prev.map(c =>
          c.session_id === sessionId
            ? { ...c, unread: { ...c.unread, operator: 0 } }
            : c,
        ),
      )
    } catch {
      // silencieux
    }
  }, [])

  const selectConversation = useCallback((sessionId: string) => {
    setSelectedId(sessionId)
    void fetchMessages(sessionId)
    void markAsRead(sessionId)
  }, [fetchMessages, markAsRead])

  // ── Réponse ──────────────────────────────────────────────────────────────
  const sendReply = useCallback(async (content: string): Promise<boolean> => {
    if (!selectedId || !content.trim()) return false
    setIsSending(true)
    setError(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${BACKEND_URL}/crisp/reply`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ session_id: selectedId, content }),
      })
      const json: unknown = await res.json()
      if (!res.ok) {
        const err = json as { message?: string }
        throw new Error(err?.message ?? `Erreur HTTP ${res.status}`)
      }
      await fetchMessages(selectedId)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
      return false
    } finally {
      setIsSending(false)
    }
  }, [selectedId, fetchMessages])

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    void fetchInboxes()
    void fetchConversations(null)
  }, [fetchInboxes, fetchConversations])

  const selectedConversation = conversations.find(c => c.session_id === selectedId) ?? null

  return {
    inboxes,
    selectedInbox,
    isLoadingInboxes,
    switchInbox,
    conversations,
    hasMore,
    isLoadingMore,
    selectedId,
    selectedConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    error,
    selectConversation,
    sendReply,
    loadMoreConversations,
    refreshConversations: () => fetchConversations(selectedInbox),
  }
}
