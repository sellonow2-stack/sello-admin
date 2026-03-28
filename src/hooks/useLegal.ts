import { useState, useEffect, useCallback } from 'react'
import { adminLegalApi, type LegalDocRecord, type LegalDocType } from '@/lib/api/backend'

export function useLegal() {
  const [docs, setDocs] = useState<LegalDocRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await adminLegalApi.list()
      setDocs(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  const getLatestByType = (type: LegalDocType): LegalDocRecord | undefined =>
    docs
      .filter(d => d.type === type)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

  const save = async (
    type: LegalDocType,
    content: string,
    version: string,
    published: boolean,
  ) => {
    setSaving(true)
    setError(null)
    try {
      const existing = getLatestByType(type)
      if (existing) {
        await adminLegalApi.update(existing.id, { content, version, published })
      } else {
        await adminLegalApi.create({ type, content, version, published })
      }
      await fetchDocs()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
      throw e
    } finally {
      setSaving(false)
    }
  }

  return { docs, loading, saving, error, getLatestByType, refetch: fetchDocs, save }
}
