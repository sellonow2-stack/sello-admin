import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface TopCategoriesChartProps {
  data: { name: string; count: number }[]
  isLoading?: boolean
}

export function TopCategoriesChart({ data, isLoading = false }: TopCategoriesChartProps) {
  const max = data[0]?.count ?? 1

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium text-gray-400">Intelligence catégories</h3>
        <p className="text-lg font-semibold text-white mt-0.5">Top catégories</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-gray-600 text-sm">
          Aucune catégorie sur cette période
        </div>
      ) : (
        <div className="space-y-2.5">
          {data.map((item, i) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-600 w-5 text-right flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300 truncate">{item.name}</span>
                  <span className="text-sm font-medium text-white ml-2 flex-shrink-0">
                    {item.count}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${(item.count / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
