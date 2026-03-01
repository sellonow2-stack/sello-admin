import { useState } from 'react'
import { Image, DollarSign, FileText } from 'lucide-react'
import { KpiCard } from '@/components/features/KpiCard'
import { DonutChart } from '@/components/features/DonutChart'
import { TopCategoriesChart } from '@/components/features/TopCategoriesChart'
import { ExportFunnelChart } from '@/components/features/ExportFunnelChart'
import { useAnalyticsMetrics, type AnalyticsMetrics } from '@/hooks/useAnalyticsMetrics'
import { cn } from '@/utils/cn'
import type { Period } from '@/hooks/useBusinessMetrics'

const PERIODS: { value: Period; label: string }[] = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '1y', label: '1 an' },
]

function formatCost(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function buildStudioData(data: AnalyticsMetrics) {
  return [
    { name: 'Studio', value: data.studioCount, color: '#6366f1' },
    { name: 'Lifestyle', value: data.lifestyleCount, color: '#8b5cf6' },
  ]
}

function buildBrandData(data: AnalyticsMetrics) {
  return [
    { name: 'Marque identifiée', value: data.withBrand, color: '#10b981' },
    { name: 'Sans marque', value: data.withoutBrand, color: '#374151' },
  ]
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const { data, isLoading, error } = useAnalyticsMetrics(period)

  const periodLabel = PERIODS.find(p => p.value === period)?.label ?? ''

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Usage IA</h1>
          <p className="text-sm text-gray-400 mt-0.5">Analytics produit — Consommation & performances</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-4 py-1.5 text-sm rounded-md font-medium transition-colors cursor-pointer',
                period === p.value
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
          Erreur : {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard
          title="Images générées"
          value={isLoading ? '—' : String(data?.imagesGenerated ?? 0)}
          subtitle={`Sur les ${periodLabel}`}
          icon={<Image size={18} className="text-indigo-400" />}
          accentColor="bg-indigo-500/10"
          isLoading={isLoading}
        />
        <KpiCard
          title="Coût IA"
          value={isLoading ? '—' : formatCost(data?.generationCostCents ?? 0)}
          subtitle={`Générations sur les ${periodLabel}`}
          icon={<DollarSign size={18} className="text-purple-400" />}
          accentColor="bg-purple-500/10"
          isLoading={isLoading}
        />
        <KpiCard
          title="Annonces créées"
          value={isLoading ? '—' : String(data?.announcementsCreated ?? 0)}
          subtitle={`Sur les ${periodLabel}`}
          icon={<FileText size={18} className="text-sky-400" />}
          accentColor="bg-sky-500/10"
          isLoading={isLoading}
        />
      </div>

      {/* Charts — ligne 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <DonutChart
          title="Répartition des générations"
          subtitle="Studio vs Lifestyle"
          data={data ? buildStudioData(data) : []}
          isLoading={isLoading}
        />
        <TopCategoriesChart
          data={data?.topCategories ?? []}
          isLoading={isLoading}
        />
      </div>

      {/* Charts — ligne 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DonutChart
          title="Identification des marques"
          subtitle="Taux de marques identifiées"
          data={data ? buildBrandData(data) : []}
          isLoading={isLoading}
        />
        <ExportFunnelChart
          data={data?.exportsByMarketplace ?? []}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
