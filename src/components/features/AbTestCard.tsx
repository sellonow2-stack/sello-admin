import { useState } from 'react'
import { FlaskConical, StopCircle, Play, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import type { PromptVersion } from '@/hooks/usePrompts'

interface AbTestCardProps {
  abTestVersion: PromptVersion | null
  activeVersion: PromptVersion | null
  onStart: (content: string, percentage: number) => Promise<void>
  onStop: () => Promise<void>
}

export function AbTestCard({ abTestVersion, activeVersion, onStart, onStop }: AbTestCardProps) {
  const [testContent, setTestContent] = useState('')
  const [percentage, setPercentage] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Pré-remplir le textarea avec le prompt actif pour faciliter les modifications
  function handleStartEdit() {
    if (!testContent && activeVersion) {
      setTestContent(activeVersion.content)
    }
  }

  async function handleStart() {
    if (!testContent.trim()) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await onStart(testContent.trim(), percentage)
      setTestContent('')
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleStop() {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await onStop()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      {/* En-tête */}
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical size={16} className={cn(abTestVersion ? 'text-violet-400' : 'text-gray-500')} />
        <h3 className="text-sm font-semibold text-white">A/B Test</h3>
        {abTestVersion ? (
          <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Test actif — {abTestVersion.ab_test_percentage}% des utilisateurs
          </span>
        ) : (
          <span className="ml-auto text-xs text-gray-600">Aucun test actif</span>
        )}
      </div>

      {abTestVersion ? (
        /* Test en cours — affiche les détails */
        <div>
          <div className="bg-gray-800 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1.5">Prompt variant en test :</p>
            <p className="text-sm text-gray-300 font-mono whitespace-pre-wrap line-clamp-4 leading-relaxed">
              {abTestVersion.content}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-800 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-500">Utilisateurs sur le variant</p>
              <p className="text-lg font-bold text-violet-400">{abTestVersion.ab_test_percentage}%</p>
            </div>
            <div className="flex-1 bg-gray-800 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-500">Utilisateurs sur le prompt actif</p>
              <p className="text-lg font-bold text-indigo-400">{100 - (abTestVersion.ab_test_percentage ?? 0)}%</p>
            </div>
          </div>

          <button
            onClick={handleStop}
            disabled={isSubmitting}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <StopCircle size={14} />
            {isSubmitting ? 'Arrêt en cours…' : 'Arrêter le test'}
          </button>
        </div>
      ) : (
        /* Formulaire pour démarrer un test */
        <div>
          <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2.5 mb-4">
            <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-400/80">
              Le prompt variant sera envoyé à un % de vos utilisateurs. Le prompt actif reste inchangé pour le reste.
            </p>
          </div>

          {/* Slider pourcentage */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-500">Pourcentage d'utilisateurs</label>
              <span className="text-sm font-bold text-violet-400">{percentage}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={percentage}
              onChange={e => setPercentage(Number(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
              <span>5%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Textarea prompt variant */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-1.5 block">Prompt variant</label>
            <textarea
              value={testContent}
              onChange={e => setTestContent(e.target.value)}
              onFocus={handleStartEdit}
              placeholder="Modifiez le prompt ici pour créer le variant de test…"
              className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 resize-y focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono leading-relaxed"
              spellCheck={false}
            />
          </div>

          <button
            onClick={handleStart}
            disabled={isSubmitting || !testContent.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Play size={14} />
            {isSubmitting ? 'Démarrage…' : `Démarrer le test (${percentage}%)`}
          </button>
        </div>
      )}

      {submitError && (
        <p className="mt-2 text-xs text-red-400">{submitError}</p>
      )}
    </Card>
  )
}
