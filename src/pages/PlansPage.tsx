import { useState } from 'react'
import {
  Plus, Pencil, Trash2, Image, FileText,
  Store, Clock, Layers, Check, X, RefreshCw, Building2,
  Link2, Copy, XCircle, ExternalLink, Loader2, AlertCircle,
} from 'lucide-react'
import { usePlans } from '@/hooks/usePlans'
import type { Plan, PlanInput } from '@/hooks/usePlans'
import { usePaymentLinks, type SelloUser } from '@/hooks/usePaymentLinks'
import type { PaymentLinkRecord } from '@/lib/api/backend'
import { PlanFormModal } from '@/components/features/PlanFormModal'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'

// ─── Onglets ──────────────────────────────────────────────────────────────────

type Tab = 'plans' | 'links'

// ─── Plans — composants ───────────────────────────────────────────────────────

function PlanBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium',
      active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-700 text-gray-500',
    )}>
      {active ? <Check size={10} /> : <X size={10} />}
      {label}
    </span>
  )
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-7 w-7 rounded-md bg-gray-800 flex items-center justify-center flex-shrink-0">
        <Icon size={13} className="text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 leading-none">{label}</p>
        <p className="text-sm font-semibold text-white mt-0.5 leading-none">{value}</p>
      </div>
    </div>
  )
}

function PlanCard({ plan, onEdit, onArchive }: { plan: Plan; onEdit: (p: Plan) => void; onArchive: (p: Plan) => void }) {
  const [archiving, setArchiving] = useState(false)
  const [archiveError, setArchiveError] = useState<string | null>(null)

  const price = plan.price_cents === 0
    ? 'Gratuit'
    : `${(plan.price_cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${plan.currency}/${plan.billing_period === 'yearly' ? 'an' : 'mois'}`

  async function handleArchive() {
    if (!confirm(`Supprimer le plan "${plan.name}" ? Cette action est irréversible.`)) return
    setArchiving(true)
    setArchiveError(null)
    try { await onArchive(plan) }
    catch (e) { setArchiveError(e instanceof Error ? e.message : 'Erreur') }
    finally { setArchiving(false) }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-base">{plan.name}</h3>
            {plan.code && (
              <span className="text-[10px] font-mono bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{plan.code}</span>
            )}
            {plan.is_custom && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-violet-500/15 text-violet-400 border border-violet-500/20">
                <Building2 size={9} />
                Sur mesure
              </span>
            )}
          </div>
          <p className="text-indigo-400 font-bold text-lg mt-0.5">{price}</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={() => onEdit(plan)} title="Modifier"
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
            <Pencil size={14} />
          </button>
          <button onClick={handleArchive} disabled={archiving} title="Supprimer"
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-40">
            {archiving ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <PlanBadge active={plan.ai_image_generation_enabled} label="Génération IA" />
        <PlanBadge active={plan.export_enabled} label="Export" />
      </div>
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-800">
        <Stat icon={Image} label="Images IA / mois" value={plan.included_ai_images_per_month || '∞'} />
        <Stat icon={FileText} label="Annonces / sem." value={plan.included_text_announcements_per_week || '∞'} />
        <Stat icon={Store} label="Marketplaces" value={plan.marketplace_connections_limit || '∞'} />
        <Stat icon={Clock} label="Historique" value={plan.history_limit} />
        <Stat icon={Layers} label="Images / annonce" value={plan.max_images_per_listing} />
      </div>
      {archiveError && <p className="text-xs text-red-400">{archiveError}</p>}
    </div>
  )
}

// ─── Payment Links — composants ───────────────────────────────────────────────

function userLabel(u: SelloUser) {
  const name = [u.firstname, u.lastname].filter(Boolean).join(' ') || null
  if (name && u.email) return `${name} — ${u.email}`
  return name ?? u.email ?? u.user_id
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} title="Copier l'URL"
      className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors cursor-pointer flex-shrink-0">
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  )
}

function LinkRow({ link, onDeactivate }: { link: PaymentLinkRecord; onDeactivate: (id: string) => Promise<void> }) {
  const [deactivating, setDeactivating] = useState(false)
  async function handleDeactivate() {
    if (!confirm("Désactiver ce lien ? L'URL ne sera plus fonctionnelle.")) return
    setDeactivating(true)
    try { await onDeactivate(link.id) }
    finally { setDeactivating(false) }
  }
  return (
    <tr className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm text-white font-medium">{link.customerName ?? '—'}</p>
        <p className="text-xs text-gray-500 mt-0.5">{link.customerEmail ?? link.customerId ?? '—'}</p>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
          {link.priceId ? link.priceId.slice(0, 20) + '…' : '—'}
        </span>
      </td>
      <td className="px-4 py-3">
        {link.userId
          ? <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{link.userId.slice(0, 8)}…</span>
          : <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded">⚠ non lié</span>}
      </td>
      <td className="px-4 py-3">
        <span className={cn(
          'inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium',
          link.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-700 text-gray-500',
        )}>
          <span className={cn('h-1.5 w-1.5 rounded-full', link.active ? 'bg-emerald-400' : 'bg-gray-500')} />
          {link.active ? 'Actif' : 'Inactif'}
        </span>
      </td>
      <td className="px-4 py-3 max-w-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-indigo-400 truncate font-mono">{link.url}</span>
          <CopyButton text={link.url} />
          <a href={link.url} target="_blank" rel="noopener noreferrer"
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0">
            <ExternalLink size={13} />
          </a>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        {link.active && (
          <button onClick={handleDeactivate} disabled={deactivating} title="Désactiver"
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-40">
            {deactivating ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
          </button>
        )}
      </td>
    </tr>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PlansPage() {
  const [tab, setTab] = useState<Tab>('plans')

  // Plans
  const { plans, isLoading: plansLoading, error: plansError, createPlan, updatePlan, archivePlan } = usePlans()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

  // Payment links
  const { paymentLinks, plans: linkPlans, users, isLoading: linksLoading, error: linksError, create, deactivate, refresh } = usePaymentLinks()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [priceId, setPriceId] = useState('')
  const [redirectUrl, setRedirectUrl] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<PaymentLinkRecord | null>(null)
  const [copiedGenerated, setCopiedGenerated] = useState(false)

  const selectedUser = users.find((u) => u.user_id === selectedUserId) ?? null
  const activePlans = linkPlans.filter((p) => p.stripe_price_id)

  function openCreate() { setEditingPlan(null); setModalOpen(true) }
  function openEdit(plan: Plan) { setEditingPlan(plan); setModalOpen(true) }

  async function handleSave(input: PlanInput) {
    if (editingPlan) {
      await updatePlan(editingPlan.id, {
        name: input.name, code: input.code || null, price_cents: input.price_cents,
        currency: input.currency, billing_period: input.billing_period,
        included_ai_images_per_month: input.included_ai_images_per_month,
        included_text_announcements_per_week: input.included_text_announcements_per_week,
        export_enabled: input.export_enabled, ai_image_generation_enabled: input.ai_image_generation_enabled,
        marketplace_connections_limit: input.marketplace_connections_limit,
        history_limit: input.history_limit, max_images_per_listing: input.max_images_per_listing,
        is_custom: input.is_custom,
      })
    } else {
      await createPlan(input)
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUserId || !priceId) return
    setGenerating(true); setGenError(null); setLastGenerated(null)
    try {
      const link = await create({
        userId: selectedUserId,
        userEmail: selectedUser?.email ?? undefined,
        userName: [selectedUser?.firstname, selectedUser?.lastname].filter(Boolean).join(' ') || undefined,
        priceId,
        redirectUrl: redirectUrl || undefined,
      })
      setLastGenerated(link)
      setSelectedUserId(''); setPriceId(''); setRedirectUrl('')
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Erreur lors de la génération')
    } finally {
      setGenerating(false)
    }
  }

  async function copyGenerated() {
    if (!lastGenerated) return
    await navigator.clipboard.writeText(lastGenerated.url)
    setCopiedGenerated(true)
    setTimeout(() => setCopiedGenerated(false), 2000)
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Plans & Abonnements</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez vos plans et générez des liens de paiement Stripe</p>
        </div>
        {tab === 'plans' && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
            <Plus size={16} />
            Nouveau plan
          </button>
        )}
        {tab === 'links' && (
          <button onClick={refresh} title="Actualiser"
            className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
            <RefreshCw size={16} />
          </button>
        )}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {([
          { key: 'plans', label: 'Plans', icon: Layers },
          { key: 'links', label: 'Liens de paiement', icon: Link2 },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
              tab === key
                ? 'bg-indigo-500/15 text-indigo-400'
                : 'text-gray-400 hover:text-white',
            )}>
            <Icon size={15} />
            {label}
            {key === 'plans' && !plansLoading && (
              <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded',
                tab === key ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-600')}>
                {plans.length}
              </span>
            )}
            {key === 'links' && !linksLoading && (
              <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded',
                tab === key ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-600')}>
                {paymentLinks.filter(l => l.active).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Onglet Plans ────────────────────────────────────────────────────── */}
      {tab === 'plans' && (
        plansLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        ) : plansError ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400 text-sm">{plansError}</div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-14 w-14 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <Layers size={24} className="text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium">Aucun plan configuré</p>
            <p className="text-gray-600 text-sm mt-1">Créez votre premier plan pour commencer</p>
            <button onClick={openCreate}
              className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
              <Plus size={16} />Créer un plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} onEdit={openEdit} onArchive={archivePlan} />
            ))}
          </div>
        )
      )}

      {/* ── Onglet Payment Links ─────────────────────────────────────────────── */}
      {tab === 'links' && (
        <div className="space-y-6">
          {/* Formulaire */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
              <Link2 size={16} className="text-indigo-400" />
              Générer un lien
            </h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Utilisateur */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Utilisateur Sello <span className="text-red-400">*</span>
                  </label>
                  <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors">
                    <option value="">— Sélectionner un utilisateur —</option>
                    {users.map(u => (
                      <option key={u.user_id} value={u.user_id}>{userLabel(u)}</option>
                    ))}
                  </select>
                  {selectedUser && (
                    <div className="mt-2 flex items-center gap-3 bg-gray-800/60 rounded-lg px-3 py-2">
                      <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-400 text-[10px] font-bold">
                          {(selectedUser.firstname?.[0] ?? selectedUser.email?.[0] ?? '?').toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-white font-medium truncate">
                          {[selectedUser.firstname, selectedUser.lastname].filter(Boolean).join(' ') || '—'}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">{selectedUser.email ?? '—'}</p>
                      </div>
                    </div>
                  )}
                </div>
                {/* Plan */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Plan <span className="text-red-400">*</span>
                  </label>
                  <select value={priceId} onChange={e => setPriceId(e.target.value)} required
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors">
                    <option value="">— Sélectionner un plan —</option>
                    {activePlans.map(p => (
                      <option key={p.id} value={p.stripe_price_id!}>
                        {p.name}{p.is_custom ? ' ★' : ''} —{' '}
                        {p.price_cents === 0 ? 'Gratuit' : `${(p.price_cents / 100).toFixed(2)} ${p.currency}/${p.billing_period === 'yearly' ? 'an' : 'mois'}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Redirect */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  URL de redirection après paiement <span className="text-gray-600">(optionnel)</span>
                </label>
                <input type="url" value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)}
                  placeholder="https://app.sello.fr/merci"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600" />
              </div>
              {genError && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                  <AlertCircle size={14} className="flex-shrink-0" />{genError}
                </div>
              )}
              <div className="flex justify-end">
                <button type="submit" disabled={generating || !selectedUserId || !priceId}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
                  {generating ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
                  Générer le lien
                </button>
              </div>
            </form>
          </div>

          {/* Lien généré */}
          {lastGenerated && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
              <p className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1.5">
                <Check size={13} />Lien généré — email pré-rempli, customer Stripe lié
              </p>
              <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
                <a href={lastGenerated.url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 text-sm text-indigo-400 font-mono truncate hover:text-indigo-300 transition-colors">
                  {lastGenerated.url}
                </a>
                <button onClick={copyGenerated}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-medium rounded-md transition-colors cursor-pointer flex-shrink-0">
                  {copiedGenerated ? <Check size={12} /> : <Copy size={12} />}
                  {copiedGenerated ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Pour : {lastGenerated.customerName ?? lastGenerated.customerEmail ?? lastGenerated.customerId} · Plan : {lastGenerated.priceId}
              </p>
            </div>
          )}

          {/* Tableau */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Liens existants</h2>
              {!linksLoading && (
                <span className="text-xs text-gray-500">{paymentLinks.length} lien{paymentLinks.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            {linksLoading ? (
              <div className="p-5 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : linksError ? (
              <div className="p-6 text-sm text-red-400 flex items-center gap-2"><AlertCircle size={14} />{linksError}</div>
            ) : paymentLinks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
                  <Link2 size={20} className="text-gray-600" />
                </div>
                <p className="text-gray-400 font-medium text-sm">Aucun lien de paiement</p>
                <p className="text-gray-600 text-xs mt-1">Générez votre premier lien avec le formulaire ci-dessus</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      {['Customer', 'Plan', 'User Sello', 'Statut', 'URL', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paymentLinks.map(link => <LinkRow key={link.id} link={link} onDeactivate={deactivate} />)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <PlanFormModal open={modalOpen} plan={editingPlan} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  )
}
