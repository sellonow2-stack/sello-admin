import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface Plan {
  id: number
  name: string
  code: string | null
  price_cents: number
  billing_period: string | null
  included_ai_images_per_month: number
  included_text_announcements_per_week: number
}

export interface UserDetail {
  user_id: string
  firstname: string | null
  lastname: string | null
  email: string | null
  role: string | null
  created_at: string
  birthdate: string | null
  subscription: {
    id: string
    status: string
    plan_id: number | null
    current_period_end: string | null
    cancel_at_period_end: boolean
    plan: Plan | null
  } | null
  wallet: { balance_credits: number; text_only_credits: number; credit_add: number } | null
  recentAnnouncements: Array<{
    id: string
    title: string | null
    status: string | null
    created_at: string
    category_text: string | null
  }>
}

type RawProfile = {
  user_id: string
  firstname: string | null
  lastname: string | null
  role: string | null
  created_at: string
  birthdate: string | null
  subscriptions: Array<{
    id: string
    status: string
    plan_id: number | null
    current_period_end: string | null
    cancel_at_period_end: boolean
    plans: Plan | null
  }>
}

type RawWallet = {
  user_id: string
  balance_credits: number
  text_only_credits: number
  credit_add: number
}

export function useUserDetail(userId: string | null) {
  const [data, setData] = useState<UserDetail | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) { setData(null); return }
    setIsLoading(true)
    setError(null)

    try {
      // credit_wallets récupéré séparément — le join imbriqué ignore la policy admin
      const [profileResult, walletResult, announcementsResult, plansResult, emailsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, firstname, lastname, role, created_at, birthdate, subscriptions(id, status, plan_id, current_period_end, cancel_at_period_end, plans(id, name, code, price_cents, billing_period))')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('credit_wallets')
          .select('user_id, balance_credits, text_only_credits, credit_add')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('announcements')
          .select('id, title, status, created_at, category_text')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('plans')
          .select('id, name, code, price_cents, billing_period, included_ai_images_per_month, included_text_announcements_per_week')
          .order('price_cents'),
        supabase.rpc('get_user_emails'),
      ])

      if (profileResult.error) throw profileResult.error
      if (walletResult.error) throw walletResult.error

      const profile = profileResult.data as unknown as RawProfile
      const wallet = walletResult.data as RawWallet | null
      const emailMap = new Map<string, string>()
      ;(emailsResult.data ?? []).forEach((r: { user_id: string; email: string }) => {
        emailMap.set(r.user_id, r.email)
      })

      const activeSub =
        profile.subscriptions?.find(s => s.status === 'active') ??
        profile.subscriptions?.[0] ?? null

      setData({
        user_id: profile.user_id,
        firstname: profile.firstname,
        lastname: profile.lastname,
        email: emailMap.get(profile.user_id) ?? null,
        role: profile.role,
        created_at: profile.created_at,
        birthdate: profile.birthdate,
        subscription: activeSub
          ? {
              id: activeSub.id,
              status: activeSub.status,
              plan_id: activeSub.plan_id,
              current_period_end: activeSub.current_period_end,
              cancel_at_period_end: activeSub.cancel_at_period_end,
              plan: activeSub.plans,
            }
          : null,
        wallet: wallet ?? null,
        recentAnnouncements: announcementsResult.data ?? [],
      })

      setPlans(plansResult.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => { void load() }, [load])

  const adjustCredits = async (
    delta: number,
    note: string,
    field: 'balance_credits' | 'text_only_credits' | 'credit_add' = 'balance_credits',
  ) => {
    if (!userId || !data?.wallet) throw new Error('Wallet introuvable')
    const current = data.wallet[field]
    const newValue = Math.max(0, current + delta)

    const [walletRes, txRes] = await Promise.all([
      supabase
        .from('credit_wallets')
        .update({ [field]: newValue })
        .eq('user_id', userId),
      supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          type: 'adjustment',
          credits_delta: delta,
          metadata: { note, source: 'admin', credit_field: field },
        }),
    ])

    if (walletRes.error) throw walletRes.error
    if (txRes.error) throw txRes.error
    await load()
  }

  const changePlan = async (planId: number) => {
    if (!userId || !data?.subscription) throw new Error('Aucun abonnement trouvé')

    const targetPlan = plans.find(p => p.id === planId)

    const { error: subError } = await supabase
      .from('subscriptions')
      .update({ plan_id: planId })
      .eq('id', data.subscription.id)
    if (subError) throw subError

    // Réinitialise les crédits selon les quotas définis dans le plan
    if (targetPlan) {
      const { error: walletError } = await supabase
        .from('credit_wallets')
        .update({
          balance_credits: targetPlan.included_ai_images_per_month,
          text_only_credits: targetPlan.included_text_announcements_per_week,
        })
        .eq('user_id', userId)
      if (walletError) throw walletError
    }

    await load()
  }

  return { data, plans, isLoading, error, adjustCredits, changePlan, reload: load }
}
