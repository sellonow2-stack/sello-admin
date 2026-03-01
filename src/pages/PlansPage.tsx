import { useState } from 'react'
import {
  Plus, Pencil, Trash2, Image, FileText, Download,
  Store, Clock, Layers, Check, X, RefreshCw, Building2,
} from 'lucide-react'
import { usePlans } from '@/hooks/usePlans'
import type { Plan, PlanInput } from '@/hooks/usePlans'
import { PlanFormModal } from '@/components/features/PlanFormModal'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'

function PlanBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium',
      active
        ? 'bg-emerald-500/15 text-emerald-400'
        : 'bg-gray-700 text-gray-500',
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

function PlanCard({
  plan,
  onEdit,
  onArchive,
}: {
  plan: Plan
  onEdit: (p: Plan) => void
  onArchive: (p: Plan) => void
}) {
  const [archiving, setArchiving] = useState(false)
  const [archiveError, setArchiveError] = useState<string | null>(null)

  const price = plan.price_cents === 0
    ? 'Gratuit'
    : `${(plan.price_cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${plan.currency}/${plan.billing_period === 'yearly' ? 'an' : 'mois'}`

  async function handleArchive() {
    if (!confirm(`Supprimer le plan "${plan.name}" ? Cette action est irréversible.`)) return
    setArchiving(true)
    setArchiveError(null)
    try {
      await onArchive(plan)
    } catch (e) {
      setArchiveError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-base">{plan.name}</h3>
            {plan.code && (
              <span className="text-[10px] font-mono bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                {plan.code}
              </span>
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
          <button
            onClick={() => onEdit(plan)}
            title="Modifier"
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleArchive}
            disabled={archiving}
            title="Supprimer"
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
          >
            {archiving ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="flex gap-2 flex-wrap">
        <PlanBadge active={plan.ai_image_generation_enabled} label="Génération IA" />
        <PlanBadge active={plan.export_enabled} label="Export" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-800">
        <Stat icon={Image} label="Images IA / mois" value={plan.included_ai_images_per_month || '∞'} />
        <Stat icon={FileText} label="Annonces / sem." value={plan.included_text_announcements_per_week || '∞'} />
        <Stat icon={Store} label="Marketplaces" value={plan.marketplace_connections_limit || '∞'} />
        <Stat icon={Clock} label="Historique" value={plan.history_limit} />
        <Stat icon={Layers} label="Images / annonce" value={plan.max_images_per_listing} />
        {plan.stripe_price_id && (
          <Stat icon={Download} label="Stripe Price ID" value={plan.stripe_price_id.slice(0, 16) + '…'} />
        )}
      </div>

      {archiveError && (
        <p className="text-xs text-red-400 mt-1">{archiveError}</p>
      )}
    </div>
  )
}

export default function PlansPage() {
  const { plans, isLoading, error, createPlan, updatePlan, archivePlan } = usePlans()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

  function openCreate() {
    setEditingPlan(null)
    setModalOpen(true)
  }

  function openEdit(plan: Plan) {
    setEditingPlan(plan)
    setModalOpen(true)
  }

  async function handleSave(input: PlanInput) {
    if (editingPlan) {
      await updatePlan(editingPlan.id, {
        name: input.name,
        code: input.code || null,
        price_cents: input.price_cents,
        currency: input.currency,
        billing_period: input.billing_period,
        included_ai_images_per_month: input.included_ai_images_per_month,
        included_text_announcements_per_week: input.included_text_announcements_per_week,
        export_enabled: input.export_enabled,
        ai_image_generation_enabled: input.ai_image_generation_enabled,
        marketplace_connections_limit: input.marketplace_connections_limit,
        history_limit: input.history_limit,
        max_images_per_listing: input.max_images_per_listing,
        is_custom: input.is_custom,
      })
    } else {
      await createPlan(input)
    }
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Plans d'abonnement</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les plans Sello — les créations sont synchronisées avec Stripe
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Nouveau plan
        </button>
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400 text-sm">
          {error}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-14 w-14 rounded-full bg-gray-800 flex items-center justify-center mb-4">
            <Layers size={24} className="text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">Aucun plan configuré</p>
          <p className="text-gray-600 text-sm mt-1">Créez votre premier plan pour commencer</p>
          <button
            onClick={openCreate}
            className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={16} />
            Créer un plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={openEdit}
              onArchive={archivePlan}
            />
          ))}
        </div>
      )}

      <PlanFormModal
        open={modalOpen}
        plan={editingPlan}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
