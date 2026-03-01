import { AlertTriangle, Clock, ImageOff } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import type { ChurnAlert } from '@/hooks/useSupport'

interface ChurnAlertsProps {
  alerts: ChurnAlert[]
  isLoading: boolean
}

function initials(firstname: string | null, lastname: string | null): string {
  const f = firstname?.[0] ?? ''
  const l = lastname?.[0] ?? ''
  return (f + l).toUpperCase() || '?'
}

function avatarColor(userId: string): string {
  const colors = [
    'bg-indigo-500', 'bg-violet-500', 'bg-pink-500',
    'bg-amber-500', 'bg-teal-500', 'bg-rose-500',
  ]
  const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function urgencyLevel(days: number | null): 'critical' | 'warning' | 'watch' {
  if (days === null || days >= 30) return 'critical'
  if (days >= 20) return 'warning'
  return 'watch'
}

export function ChurnAlerts({ alerts, isLoading }: ChurnAlertsProps) {
  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-48" />
        </div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full mb-2" />
        ))}
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-2.5 mb-5">
        <AlertTriangle size={16} className={cn(alerts.length > 0 ? 'text-amber-400' : 'text-gray-500')} />
        <h3 className="text-sm font-semibold text-white">Alertes Churn</h3>
        <span className="text-xs text-gray-500">— abonnés payants inactifs depuis ≥ 10 jours</span>
        {alerts.length > 0 && (
          <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
            {alerts.length} à risque
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
            <Clock size={18} className="text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-white">Aucune alerte</p>
          <p className="text-xs text-gray-500 mt-1">Tous vos abonnés payants sont actifs</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">Utilisateur</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">Plan</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">Dernière image</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Inactivité</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(alert => {
                const level = urgencyLevel(alert.daysSinceLastImage)
                return (
                  <tr key={alert.user_id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    {/* Avatar + nom */}
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0',
                          avatarColor(alert.user_id),
                        )}>
                          {initials(alert.firstname, alert.lastname)}
                        </div>
                        <span className="text-gray-200 font-medium">
                          {[alert.firstname, alert.lastname].filter(Boolean).join(' ') || 'Sans nom'}
                        </span>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 text-xs bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
                        {alert.planName}
                      </span>
                    </td>

                    {/* Dernière image */}
                    <td className="py-3 pr-4">
                      {alert.lastImageAt ? (
                        <span className="text-gray-400 text-xs">
                          {new Date(alert.lastImageAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-gray-600 text-xs">
                          <ImageOff size={11} />
                          Jamais
                        </span>
                      )}
                    </td>

                    {/* Badge inactivité */}
                    <td className="py-3">
                      <span className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-md',
                        level === 'critical' && 'bg-red-500/10 text-red-400 border border-red-500/20',
                        level === 'warning' && 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                        level === 'watch' && 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
                      )}>
                        {alert.daysSinceLastImage === null
                          ? 'Jamais connecté'
                          : `${alert.daysSinceLastImage}j sans activité`}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
