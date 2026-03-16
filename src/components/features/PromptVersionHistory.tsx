import { useState } from 'react'
import { History, CheckCircle2, Eye, X, Trash2, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import type { PromptVersion } from '@/hooks/usePrompts'

interface PromptVersionHistoryProps {
  versions: PromptVersion[]
  isLoading: boolean
  onActivate: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function PromptVersionHistory({ versions, isLoading, onActivate, onDelete }: PromptVersionHistoryProps) {
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteVersion, setConfirmDeleteVersion] = useState<PromptVersion | null>(null)
  const [previewVersion, setPreviewVersion] = useState<PromptVersion | null>(null)
  const [activateError, setActivateError] = useState<string | null>(null)

  async function handleDelete(version: PromptVersion) {
    setDeletingId(version.id)
    setActivateError(null)
    try {
      await onDelete(version.id)
    } catch (e) {
      setActivateError(e instanceof Error ? e.message : 'Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
      setConfirmDeleteVersion(null)
    }
  }

  // Exclure les versions A/B test de l'historique principal
  const mainVersions = versions.filter(v => !v.is_ab_test)

  async function handleActivate(version: PromptVersion) {
    if (version.is_active) return
    setActivatingId(version.id)
    setActivateError(null)
    try {
      await onActivate(version.id)
    } catch (e) {
      setActivateError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActivatingId(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <History size={16} className="text-gray-500" />
          <Skeleton className="h-4 w-32" />
        </div>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full mb-2" />
        ))}
      </Card>
    )
  }

  return (
    <>
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <History size={16} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-white">Historique des versions</h3>
          <span className="ml-auto text-xs text-gray-600 font-mono">{mainVersions.length} version{mainVersions.length !== 1 ? 's' : ''}</span>
        </div>

        {mainVersions.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-6">Aucune version enregistrée</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {mainVersions.map(version => (
              <div
                key={version.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-colors',
                  version.is_active
                    ? 'bg-indigo-500/10 border-indigo-500/30'
                    : 'bg-gray-800/50 border-gray-800 hover:border-gray-700',
                )}
              >
                {/* Badge version */}
                <span className="text-xs font-mono text-gray-500 w-8 shrink-0">v{version.version_number}</span>

                {/* Label + date */}
                <div className="flex-1 min-w-0">
                  <p className={cn('font-medium truncate', version.is_active ? 'text-indigo-300' : 'text-gray-300')}>
                    {version.label ?? `Version ${version.version_number}`}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {new Date(version.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Badge actif */}
                {version.is_active && (
                  <span className="flex items-center gap-1 text-xs text-indigo-400 shrink-0">
                    <CheckCircle2 size={12} />
                    Actif
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setPreviewVersion(version)}
                    className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-colors"
                    title="Aperçu"
                  >
                    <Eye size={13} />
                  </button>
                  {!version.is_active && (
                    <>
                      <button
                        onClick={() => handleActivate(version)}
                        disabled={activatingId === version.id}
                        className="px-2.5 py-1 text-xs bg-gray-700 hover:bg-indigo-500/20 hover:text-indigo-400 text-gray-400 rounded-md transition-colors disabled:opacity-50"
                      >
                        {activatingId === version.id ? '…' : 'Activer'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteVersion(version)}
                        disabled={deletingId === version.id}
                        className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        title="Supprimer cette version"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activateError && (
          <p className="mt-2 text-xs text-red-400">{activateError}</p>
        )}
      </Card>

      {/* Modal de confirmation de suppression */}
      {confirmDeleteVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-sm mx-4">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Supprimer cette version ?</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {confirmDeleteVersion.label ?? `Version ${confirmDeleteVersion.version_number}`} · v{confirmDeleteVersion.version_number}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-5">
                Cette action est irréversible. La version sera définitivement supprimée de la base de données.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setConfirmDeleteVersion(null)}
                  className="px-3 py-1.5 text-xs text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteVersion)}
                  disabled={deletingId === confirmDeleteVersion.id}
                  className="px-3 py-1.5 text-xs text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingId === confirmDeleteVersion.id ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'aperçu */}
      {previewVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {previewVersion.label ?? `Version ${previewVersion.version_number}`}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  v{previewVersion.version_number} · {new Date(previewVersion.created_at).toLocaleDateString('fr-FR')}
                  {previewVersion.notes ? ` · ${previewVersion.notes}` : ''}
                </p>
              </div>
              <button
                onClick={() => setPreviewVersion(null)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5">
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto leading-relaxed">
                {previewVersion.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
