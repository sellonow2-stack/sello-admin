import { useState } from 'react'
import { Wand2, Camera, Shirt, ScanSearch } from 'lucide-react'
import { usePrompts, type PromptType } from '@/hooks/usePrompts'
import { PromptEditor } from '@/components/features/PromptEditor'
import { PromptVersionHistory } from '@/components/features/PromptVersionHistory'
import { AbTestCard } from '@/components/features/AbTestCard'
import { cn } from '@/utils/cn'

const TABS: { type: PromptType; label: string; icon: typeof Camera; description: string }[] = [
  { type: 'studio', label: 'Studio', icon: Camera, description: 'Fond cyclorama blanc' },
  { type: 'lifestyle', label: 'Lifestyle', icon: Shirt, description: 'Ambiance naturelle' },
  { type: 'analyze', label: 'Analyze', icon: ScanSearch, description: 'Analyse produit' },
]

export default function PromptsPage() {
  const [activeTab, setActiveTab] = useState<PromptType>('studio')

  const {
    versions,
    activeVersion,
    abTestVersion,
    isLoading,
    error,
    saveNewVersion,
    activateVersion,
    startAbTest,
    stopAbTest,
  } = usePrompts(activeTab)

  return (
    <div className="px-8 py-8">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Wand2 size={18} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">IA & Prompt Management</h1>
          <p className="text-sm text-gray-500">Éditeur et versionnage des system prompts</p>
        </div>
      </div>

      {/* Tabs Studio / Lifestyle / Analyze */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.type}
            onClick={() => setActiveTab(tab.type)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab.type
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'text-gray-500 hover:text-gray-300',
            )}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
            <span className={cn(
              'hidden sm:inline text-[10px] font-normal',
              activeTab === tab.type ? 'text-indigo-400/60' : 'text-gray-600',
            )}>
              — {tab.description}
            </span>
          </button>
        ))}
      </div>

      {/* Erreur globale */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          Erreur de chargement : {error}
        </div>
      )}

      {/* Grille principale */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Colonne gauche — Éditeur */}
        <PromptEditor
          activeVersion={activeVersion}
          isLoading={isLoading}
          onSave={saveNewVersion}
        />

        {/* Colonne droite — Historique + A/B */}
        <div className="space-y-6">
          <PromptVersionHistory
            versions={versions}
            isLoading={isLoading}
            onActivate={activateVersion}
          />
          <AbTestCard
            abTestVersion={abTestVersion}
            activeVersion={activeVersion}
            onStart={startAbTest}
            onStop={stopAbTest}
          />
        </div>
      </div>
    </div>
  )
}
