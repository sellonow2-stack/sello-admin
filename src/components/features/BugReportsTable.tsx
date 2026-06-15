import { Fragment, useMemo, useState } from 'react'
import { Bug, ChevronDown, ChevronUp, ExternalLink, ImageIcon, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import { formatDate, getAvatarColor, getInitials } from '@/utils/user'
import type { BugReportRow, BugReportStatus, BugReportType } from '@/hooks/useBugReports'

const TYPE_LABELS: Record<BugReportType, string> = {
  GENERATION_FAILED: "Génération échouée",
  PHOTO_NOT_PROCESSED: 'Photo mal traitée',
  CREDITS_INCORRECT: 'Crédits incorrects',
  PAYMENT_FAILED: 'Paiement échoué',
  ACCOUNT_ACCESS: 'Accès compte',
  APP_SLOW_OR_BLOCKED: 'App lente / bloquée',
  OTHER: 'Autre',
}

const STATUS_LABELS: Record<BugReportStatus, { label: string; cls: string }> = {
  new: { label: 'Nouveau', cls: 'bg-amber-500/20 text-amber-400' },
  in_progress: { label: 'En cours', cls: 'bg-sky-500/20 text-sky-400' },
  resolved: { label: 'Résolu', cls: 'bg-emerald-500/20 text-emerald-400' },
  closed: { label: 'Fermé', cls: 'bg-gray-700 text-gray-400' },
}

type StatusFilter = 'all' | BugReportStatus

const STATUS_OPTIONS: BugReportStatus[] = ['new', 'in_progress', 'resolved', 'closed']

interface BugReportsTableProps {
  reports: BugReportRow[]
  isLoading: boolean
  onRefresh: () => void
  onUpdateStatus: (id: string, status: BugReportStatus) => Promise<void>
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

export function BugReportsTable({ reports, isLoading, onRefresh, onUpdateStatus }: BugReportsTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  async function handleStatusChange(id: string, status: BugReportStatus) {
    setUpdatingId(id)
    setStatusError(null)
    try {
      await onUpdateStatus(id, status)
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : 'Impossible de mettre à jour le statut')
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return reports
    return reports.filter(r => r.status === statusFilter)
  }, [reports, statusFilter])

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      all: reports.length,
      new: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    }
    reports.forEach(r => {
      base[r.status] += 1
    })
    return base
  }, [reports])

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
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <Bug size={16} className={reports.length > 0 ? 'text-red-400' : 'text-gray-500'} />
          <h3 className="text-sm font-semibold text-white">Signalements de bugs</h3>
          <span className="text-xs text-gray-500">— retours utilisateurs depuis le dashboard</span>
        </div>
        <button
          onClick={onRefresh}
          className="sm:ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-colors cursor-pointer"
        >
          <RefreshCw size={12} />
          Actualiser
        </button>
      </div>

      {statusError && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400">
          {statusError}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-5">
        {(['all', 'new', 'in_progress', 'resolved', 'closed'] as StatusFilter[]).map(key => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer',
              statusFilter === key
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300',
            )}
          >
            {key === 'all' ? 'Tous' : STATUS_LABELS[key].label}
            <span className="ml-1.5 opacity-70">({counts[key]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center mb-3">
            <Bug size={18} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-white">Aucun signalement</p>
          <p className="text-xs text-gray-500 mt-1">
            {statusFilter === 'all'
              ? 'Les bugs signalés par les utilisateurs apparaîtront ici'
              : `Aucun signalement avec le statut « ${STATUS_LABELS[statusFilter as BugReportStatus].label} »`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">Utilisateur</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">Type</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">Description</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">Statut</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">Date</th>
                <th className="pb-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(report => {
                const isExpanded = expandedId === report.id
                const status = STATUS_LABELS[report.status] ?? {
                  label: report.status,
                  cls: 'bg-gray-700 text-gray-300',
                }

                return (
                  <Fragment key={report.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : report.id)}
                      className="border-b border-gray-800/60 hover:bg-gray-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
                              getAvatarColor(report.user_id),
                            )}
                          >
                            {getInitials(report.firstname, report.lastname)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {[report.firstname, report.lastname].filter(Boolean).join(' ') || 'Sans nom'}
                            </p>
                            {report.email && (
                              <p className="text-xs text-gray-500 truncate">{report.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300 whitespace-nowrap">
                          {TYPE_LABELS[report.type] ?? report.type}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 max-w-xs">
                        <p className="text-sm text-gray-300">{truncate(report.description, 80)}</p>
                      </td>
                      <td className="py-3.5 pr-4" onClick={e => e.stopPropagation()}>
                        <select
                          value={report.status}
                          disabled={updatingId === report.id}
                          onChange={e => void handleStatusChange(report.id, e.target.value as BugReportStatus)}
                          className={cn(
                            'text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap border border-transparent',
                            'bg-gray-900 cursor-pointer outline-none focus:border-indigo-500/50 disabled:opacity-50',
                            status.cls,
                          )}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s} className="bg-gray-900 text-white">
                              {STATUS_LABELS[s].label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        <span className="text-xs text-gray-500">{formatDate(report.created_at)}</span>
                      </td>
                      <td className="py-3.5 text-gray-500">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-gray-800/60 bg-gray-800/20">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid gap-4 sm:grid-cols-2 text-sm">
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Description complète</p>
                              <p className="text-gray-300 whitespace-pre-wrap">{report.description}</p>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Statut</p>
                                <select
                                  value={report.status}
                                  disabled={updatingId === report.id}
                                  onChange={e => void handleStatusChange(report.id, e.target.value as BugReportStatus)}
                                  className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50 cursor-pointer"
                                >
                                  {STATUS_OPTIONS.map(s => (
                                    <option key={s} value={s}>
                                      {STATUS_LABELS[s].label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Page</p>
                                <a
                                  href={report.page_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs break-all"
                                >
                                  {report.page_url}
                                  <ExternalLink size={11} />
                                </a>
                              </div>
                              {report.contact_email && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">Email de contact</p>
                                  <p className="text-gray-300">{report.contact_email}</p>
                                </div>
                              )}
                              {report.screenshot_url && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">Capture d'écran</p>
                                  <a
                                    href={report.screenshot_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs"
                                  >
                                    <ImageIcon size={13} />
                                    Voir la capture
                                  </a>
                                </div>
                              )}
                              {report.last_announcement_id && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">Dernière annonce</p>
                                  <p className="text-gray-400 font-mono text-xs">{report.last_announcement_id}</p>
                                </div>
                              )}
                            </div>
                            {report.credits_balance && (
                              <div className="sm:col-span-2">
                                <p className="text-xs font-medium text-gray-500 mb-1">Solde crédits au signalement</p>
                                <pre className="text-xs text-gray-400 bg-gray-900 border border-gray-800 rounded-lg p-3 overflow-x-auto">
                                  {JSON.stringify(report.credits_balance, null, 2)}
                                </pre>
                              </div>
                            )}
                            {report.user_agent && (
                              <div className="sm:col-span-2">
                                <p className="text-xs font-medium text-gray-500 mb-1">User agent</p>
                                <p className="text-xs text-gray-500 break-all">{report.user_agent}</p>
                              </div>
                            )}
                            <div className="sm:col-span-2 text-xs text-gray-600">
                              Signalé le {formatDateTime(report.created_at)}
                              {report.updated_at !== report.created_at && (
                                <> · Mis à jour le {formatDateTime(report.updated_at)}</>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
