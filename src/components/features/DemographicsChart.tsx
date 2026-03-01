import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { AgeRange } from '@/hooks/useBusinessMetrics'

interface DemographicsChartProps {
  data: AgeRange[]
  totalWithBirthdate: number
  isLoading?: boolean
}

interface TooltipPayloadItem {
  value: number
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label} ans</p>
      <p className="text-sm font-semibold text-white">
        {payload[0].value} utilisateur{payload[0].value > 1 ? 's' : ''}
      </p>
    </div>
  )
}

export function DemographicsChart({
  data,
  totalWithBirthdate,
  isLoading = false,
}: DemographicsChartProps) {
  const hasBirthdateData = totalWithBirthdate > 0

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-400">Démographie</h3>
          <p className="text-lg font-semibold text-white mt-0.5">
            Distribution par âge
          </p>
        </div>
        {!isLoading && (
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
            {totalWithBirthdate} profils renseignés
          </span>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-52 w-full" />
      ) : !hasBirthdateData ? (
        <div className="h-52 flex items-center justify-center text-gray-600 text-sm">
          Aucune date de naissance renseignée
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="range"
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
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar
              dataKey="count"
              fill="url(#purpleGradient)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
