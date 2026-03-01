import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface UserRow {
  user_id: string
  firstname: string | null
  lastname: string | null
  email: string | null
  role: string | null
  created_at: string
  planName: string | null
  subscriptionStatus: string | null
  balanceCredits: number
  textOnlyCredits: number
  creditAdd: number
}

type RawProfile = {
  user_id: string
  firstname: string | null
  lastname: string | null
  role: string | null
  created_at: string
  subscriptions: Array<{ status: string; plans: { name: string } | null }>
}

type RawWallet = {
  user_id: string
  balance_credits: number
  text_only_credits: number
  credit_add: number
}

export function useUsers() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)

      // Requête séparée pour credit_wallets — le join imbriqué ignore la policy admin
      const [profilesResult, walletsResult, emailsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, firstname, lastname, role, created_at, subscriptions(status, plans(name))')
          .order('created_at', { ascending: false }),
        supabase
          .from('credit_wallets')
          .select('user_id, balance_credits, text_only_credits, credit_add'),
        supabase.rpc('get_user_emails'),
      ])

      if (profilesResult.error) {
        setError(profilesResult.error.message)
        setIsLoading(false)
        return
      }
      if (walletsResult.error) {
        setError(walletsResult.error.message)
        setIsLoading(false)
        return
      }

      const emailMap = new Map<string, string>()
      ;(emailsResult.data ?? []).forEach((row: { user_id: string; email: string }) => {
        emailMap.set(row.user_id, row.email)
      })

      const walletMap = new Map<string, RawWallet>()
      ;(walletsResult.data ?? []).forEach((w: RawWallet) => {
        walletMap.set(w.user_id, w)
      })

      const profiles = profilesResult.data as unknown as RawProfile[]
      const mapped: UserRow[] = profiles.map(p => {
        const activeSub = p.subscriptions?.find(s => s.status === 'active') ?? p.subscriptions?.[0]
        const wallet = walletMap.get(p.user_id)
        return {
          user_id: p.user_id,
          firstname: p.firstname,
          lastname: p.lastname,
          email: emailMap.get(p.user_id) ?? null,
          role: p.role,
          created_at: p.created_at,
          planName: activeSub?.plans?.name ?? null,
          subscriptionStatus: activeSub?.status ?? null,
          balanceCredits: wallet?.balance_credits ?? 0,
          textOnlyCredits: wallet?.text_only_credits ?? 0,
          creditAdd: wallet?.credit_add ?? 0,
        }
      })

      setUsers(mapped)
      setIsLoading(false)
    }

    void load()
  }, [])

  return { users, isLoading, error }
}
