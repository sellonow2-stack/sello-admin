import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Plan, PlanInput } from '@/hooks/usePlans'

interface PlanFormModalProps {
  open: boolean
  plan?: Plan | null   // null = création, Plan = édition
  onClose: () => void
  onSave: (input: PlanInput) => Promise<void>
}

const DEFAULT: PlanInput = {
  name: '',
  code: '',
  price_cents: 0,
  currency: 'EUR',
  billing_period: 'monthly',
  included_ai_images_per_month: 0,
  included_text_announcements_per_week: 0,
  export_enabled: false,
  ai_image_generation_enabled: false,
  marketplace_connections_limit: 0,
  history_limit: 5,
  max_images_per_listing: 5,
  is_custom: false,
  description: '',
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-300">{label}</span>
      <div
        onClick={() => onChange(!value)}
        className={cn(
          'relative w-10 h-5 rounded-full transition-colors cursor-pointer',
          value ? 'bg-indigo-500' : 'bg-gray-700',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
            value ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </div>
    </label>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 placeholder-gray-600'

export function PlanFormModal({ open, plan, onClose, onSave }: PlanFormModalProps) {
  const isEdit = plan != null
  const [form, setForm] = useState<PlanInput>(DEFAULT)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pré-remplir en mode édition
  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name,
        code: plan.code ?? '',
        price_cents: plan.price_cents,
        currency: plan.currency,
        billing_period: (plan.billing_period as 'monthly' | 'yearly') ?? 'monthly',
        included_ai_images_per_month: plan.included_ai_images_per_month,
        included_text_announcements_per_week: plan.included_text_announcements_per_week,
        export_enabled: plan.export_enabled,
        ai_image_generation_enabled: plan.ai_image_generation_enabled,
        marketplace_connections_limit: plan.marketplace_connections_limit,
        history_limit: plan.history_limit,
        max_images_per_listing: plan.max_images_per_listing,
        is_custom: plan.is_custom,
        description: '',
      })
    } else {
      setForm(DEFAULT)
    }
    setError(null)
  }, [plan, open])

  // Fermer avec Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  function set<K extends keyof PlanInput>(key: K, value: PlanInput[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Le nom est requis'); return }
    if (form.price_cents < 0) { setError('Le prix ne peut pas être négatif'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
            <h2 className="text-base font-semibold text-white">
              {isEdit ? `Modifier — ${plan.name}` : 'Nouveau plan'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Formulaire scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-6">

              {/* Identité */}
              <section>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Identité</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nom du plan">
                    <input
                      className={inputCls}
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="Ex: Smart, Pro, Sur Mesure…"
                      required
                    />
                  </Field>
                  <Field label="Code interne">
                    <input
                      className={inputCls}
                      value={form.code}
                      onChange={e => set('code', e.target.value.toUpperCase())}
                      placeholder="Ex: SMART, PRO, CUSTOM"
                    />
                  </Field>
                  <Field label="Prix (€)">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputCls}
                      value={(form.price_cents / 100).toFixed(2)}
                      onChange={e => set('price_cents', Math.round(parseFloat(e.target.value) * 100) || 0)}
                      placeholder="0.00"
                    />
                  </Field>
                  <Field label="Période de facturation">
                    <select
                      className={inputCls}
                      value={form.billing_period}
                      onChange={e => set('billing_period', e.target.value as 'monthly' | 'yearly')}
                    >
                      <option value="monthly">Mensuel</option>
                      <option value="yearly">Annuel</option>
                    </select>
                  </Field>
                  {!isEdit && (
                    <div className="col-span-2">
                      <Field label="Description (Stripe)">
                        <input
                          className={inputCls}
                          value={form.description ?? ''}
                          onChange={e => set('description', e.target.value)}
                          placeholder="Description visible dans Stripe"
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </section>

              {/* Type de plan */}
              <section>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Type</p>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <Toggle
                    label="Plan sur mesure / B2B (masqué sur le dashboard public)"
                    value={form.is_custom}
                    onChange={v => set('is_custom', v)}
                  />
                  {form.is_custom && (
                    <p className="text-xs text-amber-500 mt-2 ml-1">
                      Ce plan ne s'affichera pas sur la page des abonnements de l'application.
                    </p>
                  )}
                </div>
              </section>

              {/* Fonctionnalités */}
              <section>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Fonctionnalités</p>
                <div className="space-y-3 bg-gray-800/50 rounded-lg p-4">
                  <Toggle
                    label="Génération IA d'images"
                    value={form.ai_image_generation_enabled}
                    onChange={v => set('ai_image_generation_enabled', v)}
                  />
                  <Toggle
                    label="Export activé"
                    value={form.export_enabled}
                    onChange={v => set('export_enabled', v)}
                  />
                </div>
              </section>

              {/* Limites */}
              <section>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Limites & quotas</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Images IA / mois">
                    <input
                      type="number" min="0"
                      className={inputCls}
                      value={form.included_ai_images_per_month}
                      onChange={e => set('included_ai_images_per_month', parseInt(e.target.value) || 0)}
                    />
                  </Field>
                  <Field label="Annonces texte / semaine">
                    <input
                      type="number" min="0"
                      className={inputCls}
                      value={form.included_text_announcements_per_week}
                      onChange={e => set('included_text_announcements_per_week', parseInt(e.target.value) || 0)}
                    />
                  </Field>
                  <Field label="Connexions marketplace">
                    <input
                      type="number" min="0"
                      className={inputCls}
                      value={form.marketplace_connections_limit}
                      onChange={e => set('marketplace_connections_limit', parseInt(e.target.value) || 0)}
                    />
                  </Field>
                  <Field label="Historique (nb annonces)">
                    <input
                      type="number" min="0"
                      className={inputCls}
                      value={form.history_limit}
                      onChange={e => set('history_limit', parseInt(e.target.value) || 0)}
                    />
                  </Field>
                  <Field label="Images max par annonce">
                    <input
                      type="number" min="1"
                      className={inputCls}
                      value={form.max_images_per_listing}
                      onChange={e => set('max_images_per_listing', parseInt(e.target.value) || 1)}
                    />
                  </Field>
                </div>
              </section>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between gap-3 flex-shrink-0">
              {error && <p className="text-xs text-red-400 flex-1">{error}</p>}
              {!error && !isEdit && (
                <p className="text-xs text-gray-600 flex-1">Un produit + prix seront créés sur Stripe</p>
              )}
              {!error && isEdit && (
                <p className="text-xs text-amber-600 flex-1">Modification des features uniquement (Stripe non modifié)</p>
              )}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {saving ? 'Sauvegarde…' : isEdit ? 'Mettre à jour' : 'Créer le plan'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
