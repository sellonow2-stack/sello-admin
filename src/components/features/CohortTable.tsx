import { Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import type { CohortRow } from '@/hooks/useSupport'

interface CohortTableProps {
  rows: CohortRow[]
  isLoading: boolean
}

function retentionColor(pct: number): string {
  if (pct >= 60) return 'bg-emerald-500/30 text-emerald-300'
  if (pct >= 40) return 'bg-emerald-500/15 text-emerald-400'
  if (pct >= 20) return 'bg-amber-500/15 text-amber-400'
  if (pct >= 5)  return 'bg-orange-500/10 text-orange-400'
  return 'bg-red-500/10 text-red-500'
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric',
  })
}

const MAX_RETENTION = 5

export function CohortTable({ rows, isLoading }: CohortTableProps) {
  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-48 w-full" />
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-2.5 mb-1">
        <Users size={16} className="text-gray-500" />
        <h3 className="text-sm font-semibold text-white">Analyse de Cohorte</h3>
      </div>
      <p className="text-xs text-gray-600 mb-5 ml-6">
        % d'utilisateurs ayant généré au moins une image dans le mois relatif après leur inscription
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-8">Aucune donnée disponible</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4 whitespace-nowrap">Cohorte</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-3 pr-6 whitespace-nowrap">Taille</th>
                {Array.from({ length: MAX_RETENTION }, (_, i) => (
                  <th key={i} className="text-center text-xs font-medium text-gray-500 pb-3 px-2 whitespace-nowrap">
                    M+{i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.cohortMonth} className="border-b border-gray-800/40">
                  {/* Mois de cohorte */}
                  <td className="py-2.5 pr-4">
                    <span className="text-gray-300 font-medium text-xs whitespace-nowrap">
                      {formatMonth(row.cohortMonth)}
                    </span>
                  </td>

                  {/* Taille */}
                  <td className="py-2.5 pr-6 text-right">
                    <span className="text-gray-400 text-xs font-mono">{row.cohortSize}</span>
                  </td>

                  {/* Cellules de rétention */}
                  {Array.from({ length: MAX_RETENTION }, (_, i) => {
                    const pct = row.retention[i] ?? null
                    return (
                      <td key={i} className="py-2.5 px-2 text-center">
                        {pct === null ? (
                          <span className="inline-block w-12 h-6 rounded bg-gray-800/50 border border-dashed border-gray-700" />
                        ) : (
                          <span className={cn(
                            'inline-block w-12 py-0.5 rounded text-xs font-medium font-mono',
                            retentionColor(pct),
                          )}>
                            {pct}%
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Légende */}
      <div className="mt-4 flex items-center gap-4 flex-wrap">
        <span className="text-[10px] text-gray-600">Rétention :</span>
        {[
          { label: '≥ 60%', cls: 'bg-emerald-500/30' },
          { label: '40–59%', cls: 'bg-emerald-500/15' },
          { label: '20–39%', cls: 'bg-amber-500/15' },
          { label: '5–19%', cls: 'bg-orange-500/10' },
          { label: '< 5%', cls: 'bg-red-500/10' },
        ].map(({ label, cls }) => (
          <span key={label} className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className={cn('w-3 h-3 rounded-sm', cls)} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-3 h-3 rounded-sm border border-dashed border-gray-700 bg-gray-800/50" />
          Futur
        </span>
      </div>
    </Card>
  )
}
