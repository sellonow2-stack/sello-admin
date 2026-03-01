import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { GrowthPoint, Period } from '@/hooks/useBusinessMetrics'

interface GrowthChartProps {
  data: GrowthPoint[]
  period: Period
  isLoading?: boolean
}

function formatDate(dateStr: string, period: Period): string {
  if (period === '1y') {
    // "2024-01" → "jan 24"
    const [year, month] = dateStr.split('-')
    const d = new Date(Number(year), Number(month) - 1)
    return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
  }
  // "2024-01-15" → "15 jan"
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

interface TooltipPayloadItem {
  value: number
}

function CustomTooltip({
  active,
  payload,
  label,
  period,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  period: Period
}) {
  if (!active || !payload?.length || !label) return null
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{formatDate(label, period)}</p>
      <p className="text-sm font-semibold text-white">
        {payload[0].value} nouvel{payload[0].value > 1 ? 's' : ''} inscrit{payload[0].value > 1 ? 's' : ''}
      </p>
    </div>
  )
}

export function GrowthChart({ data, period, isLoading = false }: GrowthChartProps) {
  // Réduire les labels affichés pour éviter la surcharge
  const tickInterval = period === '7d' ? 0 : period === '30d' ? 4 : 1

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium text-gray-400">Nouveaux inscrits</h3>
        <p className="text-lg font-semibold text-white mt-0.5">
          Courbe de croissance
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-52 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={d => formatDate(d as string, period)}
              interval={tickInterval}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip period={period} />}
              cursor={{ stroke: '#374151', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#growthGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#6366f1', stroke: '#1e1b4b', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
