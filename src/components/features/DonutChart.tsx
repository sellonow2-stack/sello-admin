import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface DonutChartProps {
  data: { name: string; value: number; color: string }[]
  title: string
  subtitle?: string
  isLoading?: boolean
}

interface TooltipItem {
  name: string
  value: number
  payload: { color: string }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipItem[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.payload.color }} />
        <span className="text-xs text-gray-400">{item.name}</span>
      </div>
      <p className="text-sm font-semibold text-white mt-0.5">{item.value.toLocaleString('fr-FR')}</p>
    </div>
  )
}

export function DonutChart({ data, title, subtitle, isLoading = false }: DonutChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0)

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        {subtitle && <p className="text-lg font-semibold text-white mt-0.5">{subtitle}</p>}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center">
          <Skeleton className="h-44 w-44 rounded-full" />
        </div>
      ) : total === 0 ? (
        <div className="h-44 flex items-center justify-center text-gray-600 text-sm">
          Aucune donnée sur cette période
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2 border-t border-gray-800 pt-3">
            {data.map(item => {
              const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-300">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">{item.value.toLocaleString('fr-FR')}</span>
                    <span className="text-xs text-gray-500 w-12 text-right">{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </Card>
  )
}
