import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Period } from './useBusinessMetrics'

export interface AnalyticsMetrics {
  imagesGenerated: number
  generationCostCents: number
  announcementsCreated: number
  studioCount: number
  lifestyleCount: number
  topCategories: { name: string; count: number }[]
  withBrand: number
  withoutBrand: number
  exportsByMarketplace: { marketplace: string; count: number }[]
}

const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '1y': 365 }

function getPeriodStart(period: Period): string {
  const d = new Date()
  d.setDate(d.getDate() - PERIOD_DAYS[period])
  return d.toISOString()
}

type RawAnnouncement = {
  brand: string | null
  categories: { name: string } | null
}

export function useAnalyticsMetrics(period: Period) {
  const [data, setData] = useState<AnalyticsMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      const periodStart = getPeriodStart(period)

      try {
        const [imagesResult, announcementsResult, exportsResult] = await Promise.all([
          supabase
            .from('images_generated')
            .select('generation_type, cost_cents')
            .gte('created_at', periodStart),
          supabase
            .from('announcements')
            .select('brand, categories(name)')
            .gte('created_at', periodStart),
          supabase
            .from('exports')
            .select('marketplace')
            .gte('created_at', periodStart),
        ])

        if (imagesResult.error) throw imagesResult.error
        if (announcementsResult.error) throw announcementsResult.error
        if (exportsResult.error) throw exportsResult.error

        const images = imagesResult.data ?? []
        const announcements = announcementsResult.data as unknown as RawAnnouncement[]
        const exports_ = exportsResult.data ?? []

        // Images
        const imagesGenerated = images.length
        const generationCostCents = images.reduce((acc, img) => acc + (img.cost_cents ?? 0), 0)
        const studioCount = images.filter(img => img.generation_type === 'studio').length
        const lifestyleCount = images.filter(img => img.generation_type === 'lifestyle').length

        // Annonces
        const announcementsCreated = announcements.length
        const withBrand = announcements.filter(a => a.brand?.trim()).length
        const withoutBrand = announcementsCreated - withBrand

        const categoryMap = new Map<string, number>()
        announcements.forEach(a => {
          const name = a.categories?.name
          if (!name) return
          categoryMap.set(name, (categoryMap.get(name) ?? 0) + 1)
        })
        const topCategories = Array.from(categoryMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        // Export funnel
        const exportMap = new Map<string, number>()
        exports_.forEach(e => {
          const m = (e.marketplace as string | null) ?? 'Autre'
          exportMap.set(m, (exportMap.get(m) ?? 0) + 1)
        })
        const exportsByMarketplace = Array.from(exportMap.entries())
          .map(([marketplace, count]) => ({ marketplace, count }))
          .sort((a, b) => b.count - a.count)

        if (!cancelled) {
          setData({
            imagesGenerated,
            generationCostCents,
            announcementsCreated,
            studioCount,
            lifestyleCount,
            topCategories,
            withBrand,
            withoutBrand,
            exportsByMarketplace,
          })
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur inconnue')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [period])

  return { data, isLoading, error }
}
