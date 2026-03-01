import { useState } from 'react'
import {
  DollarSign,
  CreditCard,
  Users,
  TrendingUp,
} from 'lucide-react'
import { KpiCard } from '@/components/features/KpiCard'
import { GrowthChart } from '@/components/features/GrowthChart'
import { RevenueChart } from '@/components/features/RevenueChart'
import { DemographicsChart } from '@/components/features/DemographicsChart'
import { useBusinessMetrics, type Period } from '@/hooks/useBusinessMetrics'
import { cn } from '@/utils/cn'

const PERIODS: { value: Period; label: string }[] = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '1y', label: '1 an' },
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const { data, isLoading, error } = useBusinessMetrics(period)

  const totalWithBirthdate =
    data?.ageDistribution.reduce((acc, d) => acc + d.count, 0) ?? 0

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Vue Macro</h1>
          <p className="text-sm text-gray-400 mt-0.5">Business Health — North Star Metrics</p>
        </div>

        {/* Sélecteur de période */}
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

      {/* Erreur */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
          Erreur de chargement : {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="MRR"
          value={isLoading ? '—' : formatCurrency(data?.mrr ?? 0)}
          subtitle="Revenus récurrents mensuels"
          icon={<DollarSign size={18} className="text-indigo-400" />}
          accentColor="bg-indigo-500/10"
          isLoading={isLoading}
        />
        <KpiCard
          title="CA Crédits"
          value={isLoading ? '—' : formatCurrency(data?.creditRevenue ?? 0)}
          subtitle={`Packs achetés sur ${PERIODS.find(p => p.value === period)?.label}`}
          icon={<CreditCard size={18} className="text-purple-400" />}
          accentColor="bg-purple-500/10"
          isLoading={isLoading}
        />
        <KpiCard
          title="Utilisateurs"
          value={isLoading ? '—' : String(data?.totalUsers ?? 0)}
          subtitle={`+${data?.newUsers ?? 0} sur ${PERIODS.find(p => p.value === period)?.label}`}
          icon={<Users size={18} className="text-sky-400" />}
          accentColor="bg-sky-500/10"
          isLoading={isLoading}
        />
        <KpiCard
          title="Taux payants"
          value={isLoading ? '—' : formatPercent(data?.freeToPayingRate ?? 0)}
          subtitle={`${data?.payingUsers ?? 0} abonnés actifs`}
          icon={<TrendingUp size={18} className="text-emerald-400" />}
          accentColor="bg-emerald-500/10"
          isLoading={isLoading}
        />
      </div>

      {/* Charts — ligne 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <GrowthChart
          data={data?.growthData ?? []}
          period={period}
          isLoading={isLoading}
        />
        <RevenueChart
          data={data?.revenueByPlan ?? []}
          isLoading={isLoading}
        />
      </div>

      {/* Charts — ligne 2 */}
      <div className="grid grid-cols-1 gap-4">
        <DemographicsChart
          data={data?.ageDistribution ?? []}
          totalWithBirthdate={totalWithBirthdate}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
