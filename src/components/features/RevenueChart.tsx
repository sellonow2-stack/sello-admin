import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { PlanRevenue } from '@/hooks/useBusinessMetrics'

interface RevenueChartProps {
  data: PlanRevenue[]
  isLoading?: boolean
}

interface TooltipPayloadItem {
  value: number
  payload: PlanRevenue
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{item.payload.name}</p>
      <p className="text-sm font-semibold text-white">{item.value.toFixed(0)} €/mois</p>
      <p className="text-xs text-gray-400">{item.payload.count} abonné{item.payload.count > 1 ? 's' : ''}</p>
    </div>
  )
}

export function RevenueChart({ data, isLoading = false }: RevenueChartProps) {
  const isEmpty = data.length === 0

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium text-gray-400">Revenus récurrents</h3>
        <p className="text-lg font-semibold text-white mt-0.5">
          Répartition par plan
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-52 w-full" />
      ) : isEmpty ? (
        <div className="h-52 flex items-center justify-center text-gray-600 text-sm">
          Aucun abonnement actif
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}€`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="mrr" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Légende */}
      {!isLoading && !isEmpty && (
        <div className="flex flex-wrap gap-3 pt-1 border-t border-gray-800">
          {data.map(item => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-400">
                {item.name} · {item.count} abonné{item.count > 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
