import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ExportFunnelChartProps {
  data: { marketplace: string; count: number }[]
  isLoading?: boolean
}

const MARKETPLACE_COLORS: Record<string, string> = {
  vinted: '#09b96f',
  leboncoin: '#f97316',
  ebay: '#e53e3e',
  amazon: '#f59e0b',
  autre: '#6366f1',
}

function getColor(marketplace: string): string {
  return MARKETPLACE_COLORS[marketplace.toLowerCase()] ?? '#6366f1'
}

interface TooltipItem {
  value: number
  payload: { marketplace: string }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipItem[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400 mb-0.5 capitalize">{payload[0].payload.marketplace}</p>
      <p className="text-sm font-semibold text-white">{payload[0].value} export{payload[0].value > 1 ? 's' : ''}</p>
    </div>
  )
}

export function ExportFunnelChart({ data, isLoading = false }: ExportFunnelChartProps) {
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium text-gray-400">Funnel d'export</h3>
        <p className="text-lg font-semibold text-white mt-0.5">Destination marketplace</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-44 w-full" />
      ) : data.length === 0 ? (
        <div className="h-44 flex flex-col items-center justify-center gap-2">
          <span className="text-2xl">📦</span>
          <p className="text-gray-600 text-sm">Aucun export enregistré</p>
          <p className="text-gray-700 text-xs">Le tracking sera actif à l'ouverture de la feature</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={175}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="marketplace"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => (v as string).charAt(0).toUpperCase() + (v as string).slice(1)}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={getColor(entry.marketplace)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
