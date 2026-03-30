import { useState, useMemo } from 'react'
import { Search, Download } from 'lucide-react'
import { useUsers } from '@/hooks/useUsers'
import { UserDetailDrawer } from '@/components/features/UserDetailDrawer'
import { Skeleton } from '@/components/ui/skeleton'
import { getInitials, getAvatarColor, formatDate } from '@/utils/user'
import { cn } from '@/utils/cn'

const SUB_STATUS: Record<string, { label: string; cls: string }> = {
  active:   { label: 'Actif',     cls: 'bg-emerald-500/20 text-emerald-400' },
  trialing: { label: 'Essai',     cls: 'bg-sky-500/20 text-sky-400' },
  past_due: { label: 'Retard',    cls: 'bg-amber-500/20 text-amber-400' },
  canceled: { label: 'Annulé',    cls: 'bg-red-500/20 text-red-400' },
}

function exportCsv(rows: ReturnType<typeof useUsers>['users']) {
  const headers = ['Nom', 'Email', 'Plan', 'Crédits IA', 'Crédits annonces', 'Dernier ajout', 'Statut', 'Inscrit le']
  const lines = rows.map(u => [
    [u.firstname, u.lastname].filter(Boolean).join(' ') || '—',
    u.email ?? '—',
    u.planName ?? 'Gratuit',
    String(u.balanceCredits),
    String(u.textOnlyCredits),
    String(u.creditAdd),
    u.subscriptionStatus ?? 'Gratuit',
    formatDate(u.created_at),
  ])
  const csv = [headers, ...lines].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'utilisateurs.csv'; a.click()
  URL.revokeObjectURL(url)
}

export default function UsersPage() {
  const { users, isLoading, error } = useUsers()
  const [search, setSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return users
    return users.filter(u => {
      const name = `${u.firstname ?? ''} ${u.lastname ?? ''}`.toLowerCase()
      return name.includes(q) || (u.email ?? '').toLowerCase().includes(q)
    })
  }, [users, search])

  return (
    <>
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              CRM — {isLoading ? '…' : `${users.length} membres`}
            </p>
          </div>
          <button
            onClick={() => exportCsv(filtered)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors cursor-pointer w-fit"
          >
            <Download size={15} />
            Exporter CSV
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
            Erreur : {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Crédits</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Annonces</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Ajout</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Inscrit le</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-800">
                      <td className="px-5 py-4"><Skeleton className="h-9 w-48" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-5 w-12" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-5 w-12" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-5 w-12" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-5 w-10" /></td>
                    </tr>
                  ))
                : filtered.map(user => {
                    const subStatus = user.subscriptionStatus
                      ? (SUB_STATUS[user.subscriptionStatus] ?? { label: user.subscriptionStatus, cls: 'bg-gray-700 text-gray-300' })
                      : null
                    return (
                      <tr
                        key={user.user_id}
                        onClick={() => setSelectedUserId(user.user_id)}
                        className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 cursor-pointer transition-colors"
                      >
                        {/* Utilisateur */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn('h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0', getAvatarColor(user.user_id))}>
                              {getInitials(user.firstname, user.lastname)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {[user.firstname, user.lastname].filter(Boolean).join(' ') || 'Sans nom'}
                              </p>
                              {user.email && (
                                <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-300">
                            {user.planName ?? <span className="text-gray-600">Gratuit</span>}
                          </span>
                        </td>

                        {/* Crédits IA */}
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-white">
                            {user.balanceCredits.toLocaleString('fr-FR')}
                          </span>
                        </td>

                        {/* Crédits annonces */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-300">
                            {user.textOnlyCredits.toLocaleString('fr-FR')}
                          </span>
                        </td>

                        {/* Dernier ajout */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-400">
                            {user.creditAdd > 0
                              ? `+${user.creditAdd.toLocaleString('fr-FR')}`
                              : <span className="text-gray-600">—</span>}
                          </span>
                        </td>

                        {/* Statut */}
                        <td className="px-5 py-4">
                          {subStatus ? (
                            <span className={cn('text-xs px-2 py-1 rounded-full font-medium', subStatus.cls)}>
                              {subStatus.label}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-500">
                              Gratuit
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-500">{formatDate(user.created_at)}</span>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 text-right">
                          <span className="text-xs text-indigo-400 hover:text-indigo-300">
                            Voir →
                          </span>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>

          {!isLoading && filtered.length === 0 && (
            <div className="py-16 text-center text-gray-600 text-sm">
              {search ? `Aucun résultat pour "${search}"` : 'Aucun utilisateur'}
            </div>
          )}
          </div>
        </div>
      </div>

      <UserDetailDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </>
  )
}
