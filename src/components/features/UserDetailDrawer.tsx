import { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useUserDetail } from '@/hooks/useUserDetail'
import { getInitials, getAvatarColor, formatDate } from '@/utils/user'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'

interface UserDetailDrawerProps {
  userId: string | null
  onClose: () => void
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-700 text-gray-300',
  generated: 'bg-sky-500/20 text-sky-400',
  completed: 'bg-violet-500/20 text-violet-400',
  exported: 'bg-emerald-500/20 text-emerald-400',
  published: 'bg-green-500/20 text-green-400',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon', generated: 'Généré', completed: 'Complété',
  exported: 'Exporté', published: 'Publié',
}

const SUB_STATUS: Record<string, { label: string; cls: string }> = {
  active:    { label: 'Actif',     cls: 'bg-emerald-500/20 text-emerald-400' },
  trialing:  { label: 'Essai',     cls: 'bg-sky-500/20 text-sky-400' },
  past_due:  { label: 'En retard', cls: 'bg-amber-500/20 text-amber-400' },
  canceled:  { label: 'Annulé',    cls: 'bg-red-500/20 text-red-400' },
}

export function UserDetailDrawer({ userId, onClose }: UserDetailDrawerProps) {
  const { data, plans, isLoading, error, adjustCredits, changePlan } = useUserDetail(userId)

  // Crédit state
  const [creditAmount, setCreditAmount] = useState('')
  const [creditType, setCreditType] = useState<'add' | 'remove'>('add')
  const [creditField, setCreditField] = useState<'balance_credits' | 'text_only_credits' | 'credit_add'>('balance_credits')
  const [creditNote, setCreditNote] = useState('')
  const [creditLoading, setCreditLoading] = useState(false)
  const [creditError, setCreditError] = useState<string | null>(null)
  const [creditSuccess, setCreditSuccess] = useState(false)

  // Plan state
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  const [planSuccess, setPlanSuccess] = useState(false)

  // Reset on user change
  useEffect(() => {
    setCreditAmount('')
    setCreditNote('')
    setCreditError(null)
    setCreditSuccess(false)
    setCreditField('balance_credits')
    setSelectedPlanId('')
    setPlanError(null)
    setPlanSuccess(false)
  }, [userId])

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleCreditAdjust() {
    const amount = parseInt(creditAmount)
    if (!amount || isNaN(amount) || amount <= 0) return
    setCreditLoading(true)
    setCreditError(null)
    setCreditSuccess(false)
    try {
      await adjustCredits(creditType === 'add' ? amount : -amount, creditNote, creditField)
      setCreditAmount('')
      setCreditNote('')
      setCreditSuccess(true)
      setTimeout(() => setCreditSuccess(false), 3000)
    } catch (e) {
      setCreditError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setCreditLoading(false)
    }
  }

  async function handlePlanChange() {
    const planId = parseInt(selectedPlanId)
    if (!planId) return
    setPlanLoading(true)
    setPlanError(null)
    setPlanSuccess(false)
    try {
      await changePlan(planId)
      setSelectedPlanId('')
      setPlanSuccess(true)
      setTimeout(() => setPlanSuccess(false), 3000)
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setPlanLoading(false)
    }
  }

  const isOpen = userId !== null

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 z-30 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-[520px] bg-gray-900 border-l border-gray-800 z-40',
          'flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <span className="text-sm font-medium text-gray-400">Fiche utilisateur</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : error ? (
            <div className="p-6 text-red-400 text-sm">{error}</div>
          ) : data ? (
            <div className="divide-y divide-gray-800">
              {/* Profil */}
              <div className="px-6 py-5 flex items-center gap-4">
                <div className={cn('h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0', getAvatarColor(data.user_id))}>
                  {getInitials(data.firstname, data.lastname)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-lg">
                      {[data.firstname, data.lastname].filter(Boolean).join(' ') || 'Utilisateur sans nom'}
                    </p>
                    {data.role === 'admin' && (
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-medium">
                        ADMIN
                      </span>
                    )}
                  </div>
                  {data.email && <p className="text-sm text-gray-400 mt-0.5">{data.email}</p>}
                  <p className="text-xs text-gray-600 mt-0.5">Inscrit le {formatDate(data.created_at)}</p>
                </div>
              </div>

              {/* Abonnement */}
              <div className="px-6 py-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Abonnement</h3>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Plan actuel</p>
                    <p className="text-white font-medium mt-0.5">
                      {data.subscription?.plan?.name ?? 'Gratuit'}
                    </p>
                    {data.subscription?.current_period_end && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        Expire le {formatDate(data.subscription.current_period_end)}
                        {data.subscription.cancel_at_period_end && ' (annulation prévue)'}
                      </p>
                    )}
                  </div>
                  {data.subscription && (
                    <span className={cn('text-xs px-2 py-1 rounded-full font-medium', SUB_STATUS[data.subscription.status]?.cls ?? 'bg-gray-700 text-gray-300')}>
                      {SUB_STATUS[data.subscription.status]?.label ?? data.subscription.status}
                    </span>
                  )}
                </div>

                {data.subscription && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Changer de plan</p>
                    <div className="flex gap-2">
                      <select
                        value={selectedPlanId}
                        onChange={e => setSelectedPlanId(e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                      >
                        <option value="">Sélectionner un plan</option>
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {(p.price_cents / 100).toFixed(0)}€/{p.billing_period === 'yearly' ? 'an' : 'mois'}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handlePlanChange}
                        disabled={!selectedPlanId || planLoading}
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        {planLoading ? '…' : 'Appliquer'}
                      </button>
                    </div>
                    <div className="flex items-start gap-1.5 mt-1">
                      <AlertTriangle size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-600">Non synchronisé avec Stripe — modification en base uniquement</p>
                    </div>
                    {planError && <p className="text-xs text-red-400">{planError}</p>}
                    {planSuccess && <p className="text-xs text-emerald-400">Plan modifié avec succès</p>}
                  </div>
                )}
              </div>

              {/* Crédits */}
              <div className="px-6 py-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Crédits</h3>

                {/* Soldes */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="bg-gray-800 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] text-gray-500 mb-0.5">Crédits IA</p>
                    <p className="text-xl font-bold text-white">
                      {(data.wallet?.balance_credits ?? 0).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] text-gray-500 mb-0.5">Annonces</p>
                    <p className="text-xl font-bold text-white">
                      {(data.wallet?.text_only_credits ?? 0).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] text-gray-500 mb-0.5">Dernier ajout</p>
                    <p className="text-xl font-bold text-indigo-400">
                      {data.wallet?.credit_add
                        ? `+${data.wallet.credit_add.toLocaleString('fr-FR')}`
                        : <span className="text-gray-600 text-base font-normal">—</span>}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Sélection du type de crédit à ajuster */}
                  <div className="flex gap-2">
                    {([
                      { value: 'balance_credits', label: 'Crédits IA' },
                      { value: 'text_only_credits', label: 'Annonces' },
                      { value: 'credit_add', label: 'Ajout' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setCreditField(opt.value)}
                        className={cn(
                          'flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer',
                          creditField === opt.value
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400'
                            : 'border-gray-700 text-gray-500 hover:text-gray-300',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Toggle ajouter/retirer */}
                  <div className="flex gap-2">
                    {(['add', 'remove'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setCreditType(type)}
                        className={cn(
                          'flex-1 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer',
                          creditType === type
                            ? type === 'add'
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                              : 'bg-red-500/20 border-red-500/50 text-red-400'
                            : 'border-gray-700 text-gray-500 hover:text-gray-300',
                        )}
                      >
                        {type === 'add' ? '+ Ajouter' : '− Retirer'}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    min="1"
                    value={creditAmount}
                    onChange={e => setCreditAmount(e.target.value)}
                    placeholder="Montant (ex: 50)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 placeholder-gray-600"
                  />

                  <input
                    type="text"
                    value={creditNote}
                    onChange={e => setCreditNote(e.target.value)}
                    placeholder="Raison (geste commercial, remboursement…)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 placeholder-gray-600"
                  />

                  <button
                    onClick={handleCreditAdjust}
                    disabled={!creditAmount || parseInt(creditAmount) <= 0 || creditLoading}
                    className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {creditLoading
                      ? 'Application…'
                      : `Appliquer sur ${{ balance_credits: 'Crédits IA', text_only_credits: 'Annonces', credit_add: 'Ajout' }[creditField]}`}
                  </button>

                  {creditError && <p className="text-xs text-red-400">{creditError}</p>}
                  {creditSuccess && <p className="text-xs text-emerald-400">Crédits mis à jour avec succès</p>}
                </div>
              </div>

              {/* Historique annonces */}
              <div className="px-6 py-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Dernières annonces ({data.recentAnnouncements.length})
                </h3>
                {data.recentAnnouncements.length === 0 ? (
                  <p className="text-sm text-gray-600">Aucune annonce créée</p>
                ) : (
                  <div className="space-y-2">
                    {data.recentAnnouncements.map(a => (
                      <div key={a.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-800 last:border-0">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-300 truncate">
                            {a.title ?? a.category_text ?? 'Sans titre'}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">{formatDate(a.created_at)}</p>
                        </div>
                        <span className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                          STATUS_BADGE[a.status ?? 'draft'] ?? 'bg-gray-700 text-gray-300',
                        )}>
                          {STATUS_LABEL[a.status ?? 'draft'] ?? a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
