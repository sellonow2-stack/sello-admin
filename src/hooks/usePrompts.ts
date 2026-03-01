import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export type PromptType = 'studio' | 'lifestyle' | 'analyze'

export interface PromptVersion {
  id: string
  prompt_type: PromptType
  content: string
  version_number: number
  label: string | null
  is_active: boolean
  is_ab_test: boolean
  ab_test_percentage: number | null
  notes: string | null
  created_at: string
}

export function usePrompts(promptType: PromptType) {
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_type', promptType)
      .order('version_number', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setVersions((data ?? []) as PromptVersion[])
    }
    setIsLoading(false)
  }, [promptType])

  useEffect(() => {
    void load()
  }, [load])

  const activeVersion = versions.find(v => v.is_active && !v.is_ab_test) ?? null
  const abTestVersion = versions.find(v => v.is_active && v.is_ab_test) ?? null

  // Enregistre une nouvelle version et l'active automatiquement
  async function saveNewVersion(content: string, label?: string, notes?: string) {
    const nextNumber = versions.length > 0
      ? Math.max(...versions.map(v => v.version_number)) + 1
      : 1

    // Désactiver l'ancienne version active
    if (activeVersion) {
      const { error: deactivateErr } = await supabase
        .from('prompt_versions')
        .update({ is_active: false })
        .eq('id', activeVersion.id)
      if (deactivateErr) throw new Error(deactivateErr.message)
    }

    // Insérer la nouvelle version active
    const { error: insertErr } = await supabase
      .from('prompt_versions')
      .insert({
        prompt_type: promptType,
        content,
        version_number: nextNumber,
        label: label || null,
        notes: notes || null,
        is_active: true,
        is_ab_test: false,
      })
    if (insertErr) throw new Error(insertErr.message)

    await load()
  }

  // Active une version existante (désactive la précédente)
  async function activateVersion(id: string) {
    if (activeVersion && activeVersion.id !== id) {
      const { error: deactivateErr } = await supabase
        .from('prompt_versions')
        .update({ is_active: false })
        .eq('id', activeVersion.id)
      if (deactivateErr) throw new Error(deactivateErr.message)
    }

    const { error: activateErr } = await supabase
      .from('prompt_versions')
      .update({ is_active: true })
      .eq('id', id)
    if (activateErr) throw new Error(activateErr.message)

    await load()
  }

  // Démarre un A/B test avec un nouveau prompt
  async function startAbTest(content: string, percentage: number) {
    // Arrêter un éventuel test en cours
    if (abTestVersion) {
      await stopAbTest()
    }

    const nextNumber = versions.length > 0
      ? Math.max(...versions.map(v => v.version_number)) + 1
      : 1

    const { error: insertErr } = await supabase
      .from('prompt_versions')
      .insert({
        prompt_type: promptType,
        content,
        version_number: nextNumber,
        label: `A/B Test — ${percentage}%`,
        is_active: true,
        is_ab_test: true,
        ab_test_percentage: percentage,
      })
    if (insertErr) throw new Error(insertErr.message)

    await load()
  }

  // Arrête le test A/B en cours
  async function stopAbTest() {
    if (!abTestVersion) return

    const { error: stopErr } = await supabase
      .from('prompt_versions')
      .update({ is_active: false })
      .eq('id', abTestVersion.id)
    if (stopErr) throw new Error(stopErr.message)

    await load()
  }

  return {
    versions,
    activeVersion,
    abTestVersion,
    isLoading,
    error,
    saveNewVersion,
    activateVersion,
    startAbTest,
    stopAbTest,
  }
}
