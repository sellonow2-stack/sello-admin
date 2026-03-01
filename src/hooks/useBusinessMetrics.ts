import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export type Period = '7d' | '30d' | '1y'

export interface GrowthPoint {
  date: string
  users: number
}

export interface PlanRevenue {
  name: string
  mrr: number
  count: number
  color: string
}

export interface AgeRange {
  range: string
  count: number
}

export interface BusinessMetrics {
  mrr: number
  creditRevenue: number
  totalUsers: number
  payingUsers: number
  newUsers: number
  freeToPayingRate: number
  growthData: GrowthPoint[]
  revenueByPlan: PlanRevenue[]
  ageDistribution: AgeRange[]
}

const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '1y': 365 }

const PLAN_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

const AGE_RANGES = [
  { range: '<18', min: 0, max: 17 },
  { range: '18-24', min: 18, max: 24 },
  { range: '25-34', min: 25, max: 34 },
  { range: '35-44', min: 35, max: 44 },
  { range: '45-54', min: 45, max: 54 },
  { range: '55+', min: 55, max: 999 },
]

function getPeriodStart(period: Period): string {
  const d = new Date()
  d.setDate(d.getDate() - PERIOD_DAYS[period])
  return d.toISOString()
}

type RawSub = {
  plan_id: number | null
  plans: { name: string; price_cents: number; billing_period: string } | null
}

type RawProfile = {
  user_id: string
  created_at: string
  birthdate: string | null
}

type RawTransaction = {
  amount_cents: number | null
  created_at: string
}

export function useBusinessMetrics(period: Period) {
  const [data, setData] = useState<BusinessMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const periodStart = getPeriodStart(period)

        // Requêtes parallèles pour optimiser le temps de chargement
        const [subsResult, txResult, profilesResult] = await Promise.all([
          supabase
            .from('subscriptions')
            .select('plan_id, plans(name, price_cents, billing_period)')
            .eq('status', 'active'),
          supabase
            .from('credit_transactions')
            .select('amount_cents, created_at')
            .eq('type', 'purchase')
            .gte('created_at', periodStart),
          supabase
            .from('profiles')
            .select('user_id, created_at, birthdate'),
        ])

        if (subsResult.error) throw subsResult.error
        if (txResult.error) throw txResult.error
        if (profilesResult.error) throw profilesResult.error

        const activeSubs = subsResult.data as unknown as RawSub[]
        const creditTx = txResult.data as RawTransaction[]
        const profiles = profilesResult.data as RawProfile[]

        // --- MRR & répartition par plan ---
        let mrr = 0
        const planMap = new Map<string, PlanRevenue>()

        activeSubs.forEach((sub, i) => {
          const plan = sub.plans
          if (!plan) return
          const monthly =
            plan.billing_period === 'yearly'
              ? plan.price_cents / 12
              : plan.price_cents
          mrr += monthly

          if (!planMap.has(plan.name)) {
            planMap.set(plan.name, {
              name: plan.name,
              mrr: 0,
              count: 0,
              color: PLAN_COLORS[planMap.size % PLAN_COLORS.length],
            })
          }
          const entry = planMap.get(plan.name)!
          entry.mrr += monthly / 100
          entry.count += 1

          // Éviter l'avertissement "unused variable i"
          void i
        })

        // --- CA crédits sur la période ---
        const creditRevenue = creditTx.reduce(
          (acc, tx) => acc + (tx.amount_cents ?? 0),
          0,
        )

        // --- Métriques utilisateurs ---
        const totalUsers = profiles.length
        const payingUsers = activeSubs.length
        const newUsers = profiles.filter(p => p.created_at >= periodStart).length
        const freeToPayingRate =
          totalUsers > 0 ? (payingUsers / totalUsers) * 100 : 0

        // --- Courbe de croissance ---
        const growthMap = new Map<string, number>()
        const isYearly = period === '1y'

        profiles.forEach(p => {
          if (p.created_at < periodStart) return
          const key = isYearly
            ? p.created_at.slice(0, 7)   // "2024-01"
            : p.created_at.slice(0, 10)  // "2024-01-15"
          growthMap.set(key, (growthMap.get(key) ?? 0) + 1)
        })

        const growthData: GrowthPoint[] = []
        if (isYearly) {
          for (let i = 11; i >= 0; i--) {
            const d = new Date()
            d.setDate(1)
            d.setMonth(d.getMonth() - i)
            const key = d.toISOString().slice(0, 7)
            growthData.push({ date: key, users: growthMap.get(key) ?? 0 })
          }
        } else {
          const days = PERIOD_DAYS[period]
          for (let i = days - 1; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const key = d.toISOString().slice(0, 10)
            growthData.push({ date: key, users: growthMap.get(key) ?? 0 })
          }
        }

        // --- Démographie par âge ---
        const today = new Date()
        const ageCounts = new Map(AGE_RANGES.map(r => [r.range, 0]))

        profiles.forEach(p => {
          if (!p.birthdate) return
          const birth = new Date(p.birthdate)
          const age = today.getFullYear() - birth.getFullYear()
          const range = AGE_RANGES.find(r => age >= r.min && age <= r.max)
          if (range) ageCounts.set(range.range, (ageCounts.get(range.range) ?? 0) + 1)
        })

        const ageDistribution = AGE_RANGES.map(r => ({
          range: r.range,
          count: ageCounts.get(r.range) ?? 0,
        }))

        if (!cancelled) {
          setData({
            mrr: mrr / 100,
            creditRevenue: creditRevenue / 100,
            totalUsers,
            payingUsers,
            newUsers,
            freeToPayingRate,
            growthData,
            revenueByPlan: Array.from(planMap.values()),
            ageDistribution,
          })
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur inconnue')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [period])

  return { data, isLoading, error }
}
