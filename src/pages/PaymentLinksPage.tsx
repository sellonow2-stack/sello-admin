import { useState } from 'react'
import {
  Link2,
  Copy,
  Check,
  XCircle,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { usePaymentLinks, type SelloUser } from '@/hooks/usePaymentLinks'
import type { PaymentLinkRecord } from '@/lib/api/backend'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'

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
    <button
      onClick={handleCopy}
      title="Copier l'URL"
      className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors cursor-pointer flex-shrink-0"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium',
        active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-700 text-gray-500',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-emerald-400' : 'bg-gray-500')} />
      {active ? 'Actif' : 'Inactif'}
    </span>
  )
}

function LinkRow({
  link,
  onDeactivate,
}: {
  link: PaymentLinkRecord
  onDeactivate: (id: string) => Promise<void>
}) {
  const [deactivating, setDeactivating] = useState(false)

  async function handleDeactivate() {
    if (!confirm("Désactiver ce lien ? L'URL ne sera plus fonctionnelle.")) return
    setDeactivating(true)
    try {
      await onDeactivate(link.id)
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <tr className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm text-white font-medium">{link.customerName ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5">{link.customerEmail ?? link.customerId ?? '—'}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
          {link.priceId ? link.priceId.slice(0, 20) + '…' : '—'}
        </span>
      </td>
      <td className="px-4 py-3">
        {link.userId ? (
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
            {link.userId.slice(0, 8)}…
          </span>
        ) : (
          <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
            ⚠ non lié
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge active={link.active} />
      </td>
      <td className="px-4 py-3 max-w-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-indigo-400 truncate font-mono">{link.url}</span>
          <CopyButton text={link.url} />
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            title="Ouvrir"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        {link.active && (
          <button
            onClick={handleDeactivate}
            disabled={deactivating}
            title="Désactiver"
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
          >
            {deactivating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <XCircle size={14} />
            )}
          </button>
        )}
      </td>
    </tr>
  )
}

export default function PaymentLinksPage() {
  const { paymentLinks, plans, users, isLoading, error, create, deactivate, refresh } =
    usePaymentLinks()

  const [selectedUserId, setSelectedUserId] = useState('')
  const [priceId, setPriceId] = useState('')
  const [redirectUrl, setRedirectUrl] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<PaymentLinkRecord | null>(null)
  const [copiedGenerated, setCopiedGenerated] = useState(false)

  const selectedUser = users.find((u) => u.user_id === selectedUserId) ?? null

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUserId || !priceId) return
    setGenerating(true)
    setGenError(null)
    setLastGenerated(null)
    try {
      const link = await create({
        userId: selectedUserId,
        userEmail: selectedUser?.email ?? undefined,
        userName: [selectedUser?.firstname, selectedUser?.lastname].filter(Boolean).join(' ') || undefined,
        priceId,
        redirectUrl: redirectUrl || undefined,
      })
      setLastGenerated(link)
      setSelectedUserId('')
      setPriceId('')
      setRedirectUrl('')
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

  const activePlans = plans.filter((p) => p.stripe_price_id)

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Links</h1>
          <p className="text-sm text-gray-500 mt-1">
            Générez des liens de paiement Stripe personnalisés pour vos clients
          </p>
        </div>
        <button
          onClick={refresh}
          title="Actualiser"
          className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Formulaire de génération */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
          <Link2 size={16} className="text-indigo-400" />
          Générer un lien
        </h2>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Utilisateur Sello */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Utilisateur Sello <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">— Sélectionner un utilisateur —</option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {userLabel(u)}
                  </option>
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
              <select
                value={priceId}
                onChange={(e) => setPriceId(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">— Sélectionner un plan —</option>
                {activePlans.map((p) => (
                  <option key={p.id} value={p.stripe_price_id!}>
                    {p.name} —{' '}
                    {p.price_cents === 0
                      ? 'Gratuit'
                      : `${(p.price_cents / 100).toFixed(2)} ${p.currency}/${p.billing_period === 'yearly' ? 'an' : 'mois'}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Redirect URL (optionnel) */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              URL de redirection après paiement{' '}
              <span className="text-gray-600">(optionnel)</span>
            </label>
            <input
              type="url"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="https://app.sello.fr/merci"
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600"
            />
          </div>

          {genError && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
              <AlertCircle size={14} className="flex-shrink-0" />
              {genError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={generating || !selectedUserId || !priceId}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {generating ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
              Générer le lien
            </button>
          </div>
        </form>
      </div>

      {/* Lien généré */}
      {lastGenerated && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 mb-6">
          <p className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1.5">
            <Check size={13} />
            Lien généré avec succès — email pré-rempli, customer Stripe lié
          </p>
          <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
            <a
              href={lastGenerated.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-sm text-indigo-400 font-mono truncate hover:text-indigo-300 transition-colors"
            >
              {lastGenerated.url}
            </a>
            <button
              onClick={copyGenerated}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-medium rounded-md transition-colors cursor-pointer flex-shrink-0"
            >
              {copiedGenerated ? <Check size={12} /> : <Copy size={12} />}
              {copiedGenerated ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Pour : {lastGenerated.customerName ?? lastGenerated.customerEmail ?? lastGenerated.customerId} · Plan :{' '}
            {lastGenerated.priceId}
          </p>
        </div>
      )}

      {/* Tableau des liens */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Liens existants</h2>
          {!isLoading && (
            <span className="text-xs text-gray-500">
              {paymentLinks.length} lien{paymentLinks.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-400 flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        ) : paymentLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
              <Link2 size={20} className="text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium text-sm">Aucun lien de paiement</p>
            <p className="text-gray-600 text-xs mt-1">
              Générez votre premier lien avec le formulaire ci-dessus
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Sello
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paymentLinks.map((link) => (
                  <LinkRow key={link.id} link={link} onDeactivate={deactivate} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
