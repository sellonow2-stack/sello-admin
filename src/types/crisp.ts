// Statut Crisp : 0 = en attente, 1 = ouvert/non résolu, 2 = résolu
export type CrispConversationStatus = 0 | 1 | 2

export interface CrispMeta {
  email?: string
  nickname?: string
  avatar?: string
  ip?: string
  data?: Record<string, unknown>
}

export interface CrispUnread {
  operator: number
  visitor: number
}

export interface CrispConversation {
  session_id: string
  website_id?: string
  status: CrispConversationStatus
  created_at: number   // timestamp ms
  updated_at: number   // timestamp ms
  meta: CrispMeta
  unread: CrispUnread
  last_message?: string
}

export type CrispMessageFrom = 'user' | 'operator'

export type CrispMessageType =
  | 'text'
  | 'file'
  | 'animation'
  | 'audio'
  | 'picker'
  | 'field'
  | 'note'
  | 'event'

export interface CrispMessageUser {
  user_id?: string
  nickname?: string
  avatar?: string
  type?: string
}

export interface CrispMessage {
  fingerprint: number
  session_id?: string
  website_id?: string
  type: CrispMessageType
  from: CrispMessageFrom
  origin?: string
  content: string | Record<string, unknown>
  stamped?: boolean
  timestamp: number  // timestamp ms
  edited?: boolean
  translated?: boolean
  automated?: boolean
  user?: CrispMessageUser
}

export interface CrispInbox {
  inbox_id: string
  website_id: string
  name: string
  created_at: number
}

// Réponse brute possible des Edge Functions
export interface CrispApiResponse<T> {
  data?: T
  error?: boolean | string
  reason?: string
}
