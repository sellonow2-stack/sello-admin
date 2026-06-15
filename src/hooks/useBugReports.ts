import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export type BugReportStatus = 'new' | 'in_progress' | 'resolved' | 'closed'

export type BugReportType =
  | 'GENERATION_FAILED'
  | 'PHOTO_NOT_PROCESSED'
  | 'CREDITS_INCORRECT'
  | 'PAYMENT_FAILED'
  | 'ACCOUNT_ACCESS'
  | 'APP_SLOW_OR_BLOCKED'
  | 'OTHER'

export interface BugReportRow {
  id: string
  user_id: string
  type: BugReportType
  description: string
  page_url: string
  user_agent: string | null
  credits_balance: Record<string, unknown> | null
  last_announcement_id: string | null
  contact_email: string | null
  screenshot_url: string | null
  status: BugReportStatus
  created_at: string
  updated_at: string
  firstname: string | null
  lastname: string | null
  email: string | null
}

type RawProfile = { firstname: string | null; lastname: string | null }

type RawBugReport = {
  id: string
  user_id: string
  type: BugReportType
  description: string
  page_url: string
  user_agent: string | null
  credits_balance: Record<string, unknown> | null
  last_announcement_id: string | null
  contact_email: string | null
  screenshot_url: string | null
  status: BugReportStatus
  created_at: string
  updated_at: string
  profiles: RawProfile | RawProfile[] | null
}

function resolveProfile(profiles: RawBugReport['profiles']): RawProfile | null {
  if (!profiles) return null
  return Array.isArray(profiles) ? profiles[0] ?? null : profiles
}

export function useBugReports() {
  const [reports, setReports] = useState<BugReportRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [reportsResult, emailsResult] = await Promise.all([
        supabase
          .from('bug_reports')
          .select(`
            id, user_id, type, description, page_url, user_agent,
            credits_balance, last_announcement_id, contact_email,
            screenshot_url, status, created_at, updated_at,
            profiles (firstname, lastname)
          `)
          .order('created_at', { ascending: false }),
        supabase.rpc('get_user_emails'),
      ])

      if (reportsResult.error) throw reportsResult.error

      const emailMap = new Map<string, string>()
      if (!emailsResult.error && Array.isArray(emailsResult.data)) {
        emailsResult.data.forEach((row: { user_id: string; email: string }) => {
          emailMap.set(row.user_id, row.email)
        })
      }

      const rows: BugReportRow[] = (reportsResult.data ?? []).map((r: RawBugReport) => {
        const profile = resolveProfile(r.profiles)
        return {
          id: r.id,
          user_id: r.user_id,
          type: r.type,
          description: r.description,
          page_url: r.page_url,
          user_agent: r.user_agent,
          credits_balance: r.credits_balance,
          last_announcement_id: r.last_announcement_id,
          contact_email: r.contact_email,
          screenshot_url: r.screenshot_url,
          status: r.status,
          created_at: r.created_at,
          updated_at: r.updated_at,
          firstname: profile?.firstname ?? null,
          lastname: profile?.lastname ?? null,
          email: emailMap.get(r.user_id) ?? r.contact_email ?? null,
        }
      })

      setReports(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const updateStatus = useCallback(async (id: string, status: BugReportStatus) => {
    const { error: updateError } = await supabase
      .from('bug_reports')
      .update({ status })
      .eq('id', id)

    if (updateError) throw updateError

    setReports(prev =>
      prev.map(r =>
        r.id === id ? { ...r, status, updated_at: new Date().toISOString() } : r,
      ),
    )
  }, [])

  return { reports, isLoading, error, refresh: load, updateStatus }
}
