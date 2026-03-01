import { useState, useEffect } from 'react'
import { Save, CheckCircle, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { PromptVersion } from '@/hooks/usePrompts'

interface PromptEditorProps {
  activeVersion: PromptVersion | null
  isLoading: boolean
  onSave: (content: string, label?: string, notes?: string) => Promise<void>
}

export function PromptEditor({ activeVersion, isLoading, onSave }: PromptEditorProps) {
  const [content, setContent] = useState('')
  const [label, setLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedOk, setSavedOk] = useState(false)

  // Synchronise l'éditeur avec la version active courante
  useEffect(() => {
    if (activeVersion) {
      setContent(activeVersion.content)
    }
  }, [activeVersion?.id])

  const isDirty = activeVersion ? content !== activeVersion.content : content.length > 0

  async function handleSave() {
    if (!content.trim()) return
    setIsSaving(true)
    setSaveError(null)
    setSavedOk(false)

    try {
      await onSave(content.trim(), label.trim() || undefined, notes.trim() || undefined)
      setLabel('')
      setNotes('')
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-9 w-40" />
      </Card>
    )
  }

  return (
    <Card>
      {/* En-tête version active */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Prompt actif</h3>
          {activeVersion ? (
            <p className="text-xs text-gray-500 mt-0.5">
              v{activeVersion.version_number}
              {activeVersion.label ? ` — ${activeVersion.label}` : ''}
              {' · '}
              {new Date(activeVersion.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5">Aucune version enregistrée</p>
          )}
        </div>
        {isDirty && (
          <span className="flex items-center gap-1.5 text-xs text-amber-400">
            <Clock size={12} />
            Modifications non sauvegardées
          </span>
        )}
      </div>

      {/* Éditeur principal */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Entrez le system prompt ici…"
        className="w-full h-64 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 resize-y focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
        spellCheck={false}
      />

      {/* Métadonnées de version */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Label (optionnel)</label>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="ex : Correction ton formel"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Notes (optionnel)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="ex : Amélioration suite aux retours"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Save size={14} />
          {isSaving ? 'Enregistrement…' : 'Enregistrer une nouvelle version'}
        </button>

        {savedOk && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle size={12} />
            Version enregistrée et activée
          </span>
        )}

        {saveError && (
          <span className="text-xs text-red-400">{saveError}</span>
        )}
      </div>
    </Card>
  )
}
