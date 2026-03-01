import { useState, useRef, useEffect } from 'react'
import { MessageSquare, RefreshCw, Send, User, Bot, ImageOff, ChevronDown, Inbox } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import { useCrisp } from '@/hooks/useCrisp'
import type { CrispConversation, CrispConversationStatus, CrispMessage } from '@/types/crisp'

function formatTime(tsMs: number): string {
  const d = new Date(tsMs)
  const now = new Date()
  const diffH = (now.getTime() - d.getTime()) / 3_600_000
  if (diffH < 24) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function StatusBadge({ status }: { status: CrispConversationStatus }) {
  if (status === 0) {
    return (
      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">
        En attente
      </span>
    )
  }
  if (status === 2) {
    return (
      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
        Résolu
      </span>
    )
  }
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
      Ouvert
    </span>
  )
}

function ConversationItem({
  conv,
  isSelected,
  onSelect,
}: {
  conv: CrispConversation
  isSelected: boolean
  onSelect: () => void
}) {
  const name = conv.meta?.nickname || conv.meta?.email || 'Visiteur anonyme'
  const email = conv.meta?.email
  const hasUnread = (conv.unread?.operator ?? 0) > 0

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors',
        isSelected && 'bg-indigo-500/10 border-l-2 border-l-indigo-500',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {hasUnread && (
            <span className="h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
          )}
          <span className={cn(
            'text-sm font-medium truncate',
            isSelected ? 'text-indigo-300' : 'text-gray-200',
          )}>
            {name}
          </span>
        </div>
        <span className="text-[10px] text-gray-600 shrink-0 mt-0.5">
          {formatTime(conv.updated_at)}
        </span>
      </div>

      {email && name !== email && (
        <p className="text-xs text-gray-600 truncate mt-0.5 pl-4">{email}</p>
      )}

      {conv.last_message && (
        <p className="text-xs text-gray-500 truncate mt-0.5 pl-4">
          {conv.last_message}
        </p>
      )}

      <div className="mt-1.5 pl-4">
        <StatusBadge status={conv.status} />
      </div>
    </button>
  )
}

function MessageBubble({ msg }: { msg: CrispMessage }) {
  const isOperator = msg.from === 'operator'
  const isBot = msg.automated === true
  const content =
    typeof msg.content === 'string'
      ? msg.content
      : JSON.stringify(msg.content, null, 2)

  if (msg.type === 'note') {
    return (
      <div className="flex justify-center">
        <div className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400 max-w-[80%] text-center italic">
          📝 Note interne : {content}
        </div>
      </div>
    )
  }

  if (msg.type === 'event') {
    return (
      <div className="flex justify-center">
        <p className="text-[10px] text-gray-600 italic">{content}</p>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex gap-2',
      isOperator ? 'flex-row-reverse ml-auto max-w-[80%]' : 'max-w-[80%]',
    )}>
      {/* Avatar */}
      <div className={cn(
        'h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-1',
        isBot
          ? 'bg-violet-500/20'
          : isOperator
            ? 'bg-indigo-500/20'
            : 'bg-gray-700',
      )}>
        {isBot ? (
          <Bot size={13} className="text-violet-400" />
        ) : isOperator ? (
          <User size={13} className="text-indigo-400" />
        ) : (
          <User size={13} className="text-gray-400" />
        )}
      </div>

      <div className="min-w-0">
        {/* Label auteur */}
        {(msg.user?.nickname || isBot) && (
          <p className={cn('text-[10px] mb-0.5 flex items-center gap-1', isOperator ? 'text-right justify-end' : '')}>
            {isBot && (
              <span className="text-violet-400 font-medium">🤖 Bot automatique</span>
            )}
            {!isBot && msg.user?.nickname && (
              <span className="text-gray-600">{msg.user.nickname}</span>
            )}
          </p>
        )}

        {/* Bulle */}
        <div className={cn(
          'rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words',
          isBot
            ? 'bg-violet-600/20 text-violet-100 border border-violet-500/20 rounded-tr-sm'
            : isOperator
              ? 'bg-indigo-600/30 text-indigo-100 rounded-tr-sm'
              : 'bg-gray-800 text-gray-200 rounded-tl-sm',
        )}>
          {content}
        </div>

        <p className={cn('text-[10px] text-gray-600 mt-1', isOperator ? 'text-right' : '')}>
          {formatTime(msg.timestamp)}
        </p>
      </div>
    </div>
  )
}

export function CrispDashboard() {
  const {
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
    refreshConversations,
  } = useCrisp()

  const [replyText, setReplyText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!replyText.trim() || isSending) return
    const ok = await sendReply(replyText)
    if (ok) setReplyText('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const pendingCount = conversations.filter(c => c.status === 0).length
  const unreadCount = conversations.filter(c => (c.unread?.operator ?? 0) > 0).length

  // Stats messages automatisés dans la conv sélectionnée
  const botCount = messages.filter(m => m.automated).length
  const totalCount = messages.filter(m => m.type !== 'event').length

  return (
    <Card className="p-0 overflow-hidden">
      {/* En-tête */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-800">
        <MessageSquare size={16} className="text-indigo-400" />
        <h3 className="text-sm font-semibold text-white">Conversations Crisp</h3>

        <div className="flex items-center gap-2 ml-1">
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
              {pendingCount} en attente
            </span>
          )}
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
              {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <button
          onClick={() => void refreshConversations()}
          disabled={isLoadingConversations}
          className="ml-auto p-1.5 rounded-md hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
          title="Rafraîchir"
        >
          <RefreshCw size={14} className={isLoadingConversations ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Corps : split panel */}
      <div className="flex h-[600px]">
        {/* Panneau gauche — liste des conversations */}
        <div className="w-72 shrink-0 border-r border-gray-800 overflow-y-auto flex flex-col">

          {/* Sélecteur d'inbox */}
          <div className="px-3 pt-3 pb-2 border-b border-gray-800 flex flex-wrap gap-1.5">
            <button
              onClick={() => switchInbox(null)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors',
                selectedInbox === null
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800',
              )}
            >
              <Inbox size={10} />
              Tous
            </button>
            {isLoadingInboxes && (
              <RefreshCw size={10} className="text-gray-600 animate-spin mt-1" />
            )}
            {inboxes.map(inbox => (
              <button
                key={inbox.inbox_id}
                onClick={() => switchInbox(inbox.inbox_id)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors max-w-[110px]',
                  selectedInbox === inbox.inbox_id
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800',
                )}
              >
                <span className="truncate">{inbox.name}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <RefreshCw size={20} className="text-gray-600 animate-spin" />
                <p className="text-xs text-gray-600">Chargement…</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-2">
                <MessageSquare size={24} className="text-gray-700" />
                <p className="text-sm text-gray-500">Aucune conversation</p>
              </div>
            ) : (
              <>
                {conversations.map(conv => (
                  <ConversationItem
                    key={conv.session_id}
                    conv={conv}
                    isSelected={conv.session_id === selectedId}
                    onSelect={() => selectConversation(conv.session_id)}
                  />
                ))}

                {/* Bouton charger plus */}
                {hasMore && (
                  <button
                    onClick={() => void loadMoreConversations()}
                    disabled={isLoadingMore}
                    className="w-full py-3 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/40 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isLoadingMore ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <ChevronDown size={12} />
                    )}
                    {isLoadingMore ? 'Chargement…' : 'Charger plus'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Compteur total */}
          {conversations.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-800 text-[10px] text-gray-600 shrink-0">
              {conversations.length} conversation{conversations.length > 1 ? 's' : ''} chargée{conversations.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Panneau droit — thread + réponse */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center">
                <MessageSquare size={20} className="text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-500">Sélectionnez une conversation</p>
              <p className="text-xs text-gray-600">Les messages s'afficheront ici</p>
            </div>
          ) : (
            <>
              {/* Header de la conversation */}
              {selectedConversation && (
                <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                    {selectedConversation.meta?.avatar ? (
                      <img
                        src={selectedConversation.meta.avatar}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <User size={14} className="text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {selectedConversation.meta?.nickname ||
                        selectedConversation.meta?.email ||
                        'Visiteur anonyme'}
                    </p>
                    {selectedConversation.meta?.email && (
                      <p className="text-xs text-gray-500 truncate">
                        {selectedConversation.meta.email}
                      </p>
                    )}
                  </div>

                  {/* Stats de la conv */}
                  <div className="ml-auto flex items-center gap-2 shrink-0">
                    {botCount > 0 && !isLoadingMessages && (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20">
                        <Bot size={10} />
                        {botCount} auto
                      </span>
                    )}
                    {totalCount > 0 && !isLoadingMessages && (
                      <span className="text-[10px] text-gray-600">
                        {totalCount} msg
                      </span>
                    )}
                    <StatusBadge status={selectedConversation.status} />
                  </div>
                </div>
              )}

              {/* Zone messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {isLoadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <RefreshCw size={18} className="text-gray-600 animate-spin" />
                    <p className="text-xs text-gray-600">Chargement des messages…</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <ImageOff size={20} className="text-gray-700" />
                    <p className="text-sm text-gray-600">Aucun message</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <MessageBubble key={msg.fingerprint} msg={msg} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Zone de réponse */}
              <div className="px-4 py-3 border-t border-gray-800">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Répondre… (Entrée pour envoyer, Shift+Entrée pour saut de ligne)"
                    rows={2}
                    className="flex-1 resize-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                  />
                  <button
                    onClick={() => void handleSend()}
                    disabled={!replyText.trim() || isSending}
                    className={cn(
                      'p-2.5 rounded-lg transition-colors shrink-0',
                      replyText.trim() && !isSending
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed',
                    )}
                    title="Envoyer"
                  >
                    {isSending ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 mt-1.5">
                  Entrée pour envoyer · Shift+Entrée pour nouvelle ligne
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
