import { useState } from 'react'
import { Copy, Link2, Loader2, Plus, RefreshCw, Users } from 'lucide-react'
import { useAffiliateLinks } from '@/hooks/useAffiliateLinks'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
    >
      <Copy size={12} />
      {copied ? 'Copié' : 'Copier'}
    </button>
  )
}

export default function AffiliatePage() {
  const { links, loading, error, refresh, create } = useAffiliateLinks()
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [level, setLevel] = useState<'micro' | 'partner'>('micro')
  const [notes, setNotes] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setFormError(null)
    try {
      await create({ name: name.trim(), level, notes: notes.trim() || undefined })
      setName('')
      setNotes('')
      setLevel('micro')
      setShowForm(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Liens influenceurs</h1>
          <p className="text-gray-400 text-sm mt-1">
            Gère les liens affiliate /ref/{'{code}'} — stats inscriptions totales et 30 jours
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer"
          >
            <RefreshCw size={14} />
            Actualiser
          </button>
          <button
            type="button"
            onClick={() => setShowForm(v => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg cursor-pointer"
          >
            <Plus size={14} />
            Nouveau lien
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nom</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="Marion — Instagram"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Niveau</label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value as 'micro' | 'partner')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="micro">Micro-influenceur (plafond 20)</option>
                <option value="partner">Performance (plafond 50)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              placeholder="Optionnel"
            />
          </div>
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg disabled:opacity-50 cursor-pointer"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Créer le lien
          </button>
        </form>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          Aucun lien affiliate. Crée le premier ci-dessus.
        </div>
      ) : (
        <div className="grid gap-4">
          {links.map(link => (
            <div
              key={link.id}
              className={cn(
                'bg-gray-900 border rounded-xl p-5',
                link.is_active ? 'border-gray-800' : 'border-gray-800/50 opacity-60',
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-semibold">{link.name}</h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                      {link.level}
                    </span>
                    {!link.is_active && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400">
                        Désactivé
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                    <Link2 size={14} />
                    <code className="text-indigo-400">{link.url}</code>
                    <CopyButton text={link.url} />
                  </div>
                  {link.notes && (
                    <p className="text-xs text-gray-500 mt-2">{link.notes}</p>
                  )}
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Total</p>
                    <p className="text-white font-semibold flex items-center gap-1">
                      <Users size={14} />
                      {link.signups_total} / {link.max_signups}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">30 jours</p>
                    <p className="text-white font-semibold">{link.signups_last_30_days}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Confirmés</p>
                    <p className="text-emerald-400 font-semibold">{link.signups_confirmed}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
