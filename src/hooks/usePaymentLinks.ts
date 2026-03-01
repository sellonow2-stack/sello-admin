import { useCallback, useEffect, useState } from 'react'
import { adminPlansApi, paymentLinksApi, type PaymentLinkRecord, type PlanRecord } from '@/lib/api/backend'
import { supabase } from '@/lib/supabase/client'

export interface SelloUser {
  user_id: string
  firstname: string | null
  lastname: string | null
  email: string | null
}

export function usePaymentLinks() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLinkRecord[]>([])
  const [plans, setPlans] = useState<PlanRecord[]>([])
  const [users, setUsers] = useState<SelloUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [links, plansList, profilesResult, emailsResult] = await Promise.all([
        paymentLinksApi.list(),
        adminPlansApi.list(),
        supabase
          .from('profiles')
          .select('user_id, firstname, lastname')
          .order('created_at', { ascending: false }),
        supabase.rpc('get_user_emails'),
      ])

      setPaymentLinks(links)
      setPlans(plansList)

      const emailMap = new Map<string, string>()
      ;(emailsResult.data ?? []).forEach((row: { user_id: string; email: string }) => {
        emailMap.set(row.user_id, row.email)
      })

      const mappedUsers: SelloUser[] = (profilesResult.data ?? []).map(
        (p: { user_id: string; firstname: string | null; lastname: string | null }) => ({
          user_id: p.user_id,
          firstname: p.firstname,
          lastname: p.lastname,
          email: emailMap.get(p.user_id) ?? null,
        }),
      )
      setUsers(mappedUsers)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(
    async (params: {
      userId: string
      userEmail?: string
      userName?: string
      priceId: string
      redirectUrl?: string
    }) => {
      const newLink = await paymentLinksApi.create(params)
      setPaymentLinks((prev) => [newLink, ...prev])
      return newLink
    },
    [],
  )

  const deactivate = useCallback(async (id: string) => {
    await paymentLinksApi.deactivate(id)
    setPaymentLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, active: false } : link)),
    )
  }, [])

  return {
    paymentLinks,
    plans,
    users,
    isLoading,
    error,
    refresh: load,
    create,
    deactivate,
  }
}
