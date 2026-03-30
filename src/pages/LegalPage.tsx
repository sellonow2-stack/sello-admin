import { useState, useEffect } from 'react'
import { FileText, Save, Eye, EyeOff, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { useLegal } from '@/hooks/useLegal'
import type { LegalDocType } from '@/lib/api/backend'

const TABS: { type: LegalDocType; label: string; description: string }[] = [
  {
    type: 'cgu',
    label: 'CGU',
    description: "Conditions Générales d'Utilisation",
  },
  {
    type: 'cgv',
    label: 'CGV',
    description: 'Conditions Générales de Vente',
  },
  {
    type: 'privacy_policy',
    label: 'Politique de confidentialité',
    description: 'Politique de confidentialité et traitement des données',
  },
]

interface TabState {
  content: string
  version: string
  published: boolean
  dirty: boolean
  saved: boolean
}

export default function LegalPage() {
  const { loading, saving, error, getLatestByType, save } = useLegal()
  const [activeTab, setActiveTab] = useState<LegalDocType>('cgu')
  const [states, setStates] = useState<Record<LegalDocType, TabState>>({
    cgu: { content: '', version: '1.0', published: false, dirty: false, saved: false },
    cgv: { content: '', version: '1.0', published: false, dirty: false, saved: false },
    privacy_policy: { content: '', version: '1.0', published: false, dirty: false, saved: false },
  })

  useEffect(() => {
    if (loading) return
    setStates(prev => {
      const next = { ...prev }
      for (const tab of TABS) {
        const doc = getLatestByType(tab.type)
        if (doc && !prev[tab.type].dirty) {
          next[tab.type] = {
            content: doc.content,
            version: doc.version,
            published: doc.published,
            dirty: false,
            saved: false,
          }
        }
      }
      return next
    })
  }, [loading, getLatestByType])

  const update = (field: keyof Omit<TabState, 'dirty' | 'saved'>, value: string | boolean) => {
    setStates(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [field]: value, dirty: true, saved: false },
    }))
  }

  const handleSave = async () => {
    const s = states[activeTab]
    try {
      await save(activeTab, s.content, s.version, s.published)
      setStates(prev => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], dirty: false, saved: true },
      }))
      setTimeout(() => {
        setStates(prev => ({
          ...prev,
          [activeTab]: { ...prev[activeTab], saved: false },
        }))
      }, 3000)
    } catch {
      // error déjà géré dans le hook
    }
  }

  const current = states[activeTab]
  const activeTabMeta = TABS.find(t => t.type === activeTab)!
  const existingDoc = getLatestByType(activeTab)

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <FileText size={18} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Documents légaux</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              CGU · CGV · Politique de confidentialité
            </p>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle size={15} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative ${
                activeTab === tab.type
                  ? 'text-indigo-400 bg-indigo-500/10 border-b-2 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              {tab.label}
              {states[tab.type].dirty && (
                <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Editor panel */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-5">
        {/* Meta row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">{activeTabMeta.description}</p>
            {existingDoc && (
              <p className="text-xs text-gray-500 mt-0.5">
                Dernière mise à jour :{' '}
                {new Date(existingDoc.updated_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Version */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Version</label>
              <input
                type="text"
                value={current.version}
                onChange={e => update('version', e.target.value)}
                className="w-16 px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Published toggle */}
            <button
              onClick={() => update('published', !current.published)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                current.published
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              {current.published ? (
                <Eye size={13} />
              ) : (
                <EyeOff size={13} />
              )}
              {current.published ? 'Publié' : 'Non publié'}
            </button>
          </div>
        </div>

        {/* Textarea */}
        {loading ? (
          <div className="h-96 rounded-lg bg-gray-800/50 animate-pulse" />
        ) : (
          <textarea
            value={current.content}
            onChange={e => update('content', e.target.value)}
            placeholder={`Rédigez les ${activeTabMeta.description} en Markdown…`}
            className="w-full h-96 px-4 py-3 text-sm bg-gray-800/60 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-y font-mono leading-relaxed"
          />
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-600">
            {current.content.length.toLocaleString('fr-FR')} caractères
          </p>

          <div className="flex items-center gap-3">
            {current.saved && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle size={13} />
                Sauvegardé
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !current.dirty || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {saving ? 'Sauvegarde…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      {/* History table */}
      {existingDoc && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Document actuel
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="font-mono text-xs bg-gray-800 px-2 py-0.5 rounded text-indigo-400">
              v{existingDoc.version}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                existingDoc.published
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-gray-800 text-gray-500'
              }`}
            >
              {existingDoc.published ? 'Publié' : 'Brouillon'}
            </span>
            <span className="text-xs text-gray-600">
              ID : {existingDoc.id.slice(0, 8)}…
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
