import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface ChurnAlert {
  user_id: string
  firstname: string | null
  lastname: string | null
  planName: string
  planCode: string | null
  lastImageAt: string | null
  daysSinceLastImage: number | null
}

export interface CohortRow {
  cohortMonth: string          // "2025-01"
  cohortSize: number
  retention: (number | null)[] // index = mois relatif (0, 1, 2, 3…), null = futur
}

type RawSub = {
  user_id: string
  status: string
  plans: { name: string; price_cents: number; code: string | null } | null
}

type RawProfile = {
  user_id: string
  firstname: string | null
  lastname: string | null
  created_at: string
}

type RawImage = {
  user_id: string
  created_at: string
}

function addMonths(monthStr: string, offset: number): string {
  const [year, month] = monthStr.split('-').map(Number)
  const d = new Date(year, month - 1 + offset, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const CHURN_DAYS = 10
const COHORT_COUNT = 6
const RETENTION_MONTHS = 5

export function useSupport() {
  const [churnAlerts, setChurnAlerts] = useState<ChurnAlert[]>([])
  const [cohortRows, setCohortRows] = useState<CohortRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const [subsResult, profilesResult, imagesResult] = await Promise.all([
          supabase
            .from('subscriptions')
            .select('user_id, status, plans(name, price_cents, code)')
            .eq('status', 'active'),
          supabase
            .from('profiles')
            .select('user_id, firstname, lastname, created_at')
            .order('created_at', { ascending: false }),
          supabase
            .from('images_generated')
            .select('user_id, created_at')
            .order('created_at', { ascending: false }),
        ])

        if (subsResult.error) throw subsResult.error
        if (profilesResult.error) throw profilesResult.error
        if (imagesResult.error) throw imagesResult.error

        const activeSubs = subsResult.data as unknown as RawSub[]
        const profiles = profilesResult.data as RawProfile[]
        const images = imagesResult.data as RawImage[]

        const now = new Date()
        const currentMonth = now.toISOString().slice(0, 7)

        // --- Map dernière image par user_id ---
        const lastImageByUser = new Map<string, string>()
        images.forEach(img => {
          if (!lastImageByUser.has(img.user_id)) {
            lastImageByUser.set(img.user_id, img.created_at)
          }
        })

        // --- Alertes churn : abonnés payants inactifs depuis ≥ 10 jours ---
        const profileMap = new Map(profiles.map(p => [p.user_id, p]))

        const alerts: ChurnAlert[] = activeSubs
          .filter(sub => sub.plans && (sub.plans.price_cents ?? 0) > 0)
          .map(sub => {
            const profile = profileMap.get(sub.user_id)
            const lastImageAt = lastImageByUser.get(sub.user_id) ?? null
            const daysSince = lastImageAt
              ? Math.floor((now.getTime() - new Date(lastImageAt).getTime()) / 86_400_000)
              : null
            return {
              user_id: sub.user_id,
              firstname: profile?.firstname ?? null,
              lastname: profile?.lastname ?? null,
              planName: sub.plans?.name ?? 'Plan inconnu',
              planCode: sub.plans?.code ?? null,
              lastImageAt,
              daysSinceLastImage: daysSince,
            }
          })
          .filter(u => u.daysSinceLastImage === null || u.daysSinceLastImage >= CHURN_DAYS)
          .sort((a, b) => (b.daysSinceLastImage ?? 9999) - (a.daysSinceLastImage ?? 9999))

        // --- Analyse de cohorte ---
        // Mois d'inscription → ensemble de user_ids
        const cohortMap = new Map<string, Set<string>>()
        profiles.forEach(p => {
          const month = p.created_at.slice(0, 7)
          if (!cohortMap.has(month)) cohortMap.set(month, new Set())
          cohortMap.get(month)!.add(p.user_id)
        })

        // user_id → ensemble de mois d'activité (génération d'image)
        const activityByUser = new Map<string, Set<string>>()
        images.forEach(img => {
          const month = img.created_at.slice(0, 7)
          if (!activityByUser.has(img.user_id)) activityByUser.set(img.user_id, new Set())
          activityByUser.get(img.user_id)!.add(month)
        })

        // Prendre les N derniers mois de cohorte
        const sortedCohorts = Array.from(cohortMap.keys())
          .sort()
          .reverse()
          .slice(0, COHORT_COUNT)

        const rows: CohortRow[] = sortedCohorts.map(cohortMonth => {
          const users = cohortMap.get(cohortMonth)!
          const cohortSize = users.size
          const userArr = Array.from(users)

          const retention: (number | null)[] = []
          for (let offset = 0; offset < RETENTION_MONTHS; offset++) {
            const targetMonth = addMonths(cohortMonth, offset)
            if (targetMonth > currentMonth) {
              retention.push(null) // mois futur
            } else {
              const active = userArr.filter(uid =>
                activityByUser.get(uid)?.has(targetMonth)
              ).length
              retention.push(cohortSize > 0 ? Math.round((active / cohortSize) * 100) : 0)
            }
          }

          return { cohortMonth, cohortSize, retention }
        })

        if (!cancelled) {
          setChurnAlerts(alerts)
          setCohortRows(rows)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur inconnue')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [])

  return { churnAlerts, cohortRows, isLoading, error }
}
