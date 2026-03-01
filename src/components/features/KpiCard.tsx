import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: number
  icon: React.ReactNode
  accentColor: string
  isLoading?: boolean
}

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  accentColor,
  isLoading = false,
}: KpiCardProps) {
  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-20" />
      </Card>
    )
  }

  const trendPositive = trend !== undefined && trend >= 0

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-400 font-medium">{title}</span>
          <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
          {subtitle && (
            <span className="text-sm text-gray-500">{subtitle}</span>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', accentColor)}>
          {icon}
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-1.5">
          {trendPositive ? (
            <TrendingUp size={14} className="text-emerald-400" />
          ) : (
            <TrendingDown size={14} className="text-red-400" />
          )}
          <span
            className={cn(
              'text-sm font-medium',
              trendPositive ? 'text-emerald-400' : 'text-red-400',
            )}
          >
            {trendPositive ? '+' : ''}{trend.toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500">vs période préc.</span>
        </div>
      )}
    </Card>
  )
}
