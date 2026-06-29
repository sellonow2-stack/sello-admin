import { useCallback, useEffect, useState } from 'react'
import {
  adminAffiliateApi,
  type AffiliateLinkRecord,
  type CreateAffiliateLinkPayload,
} from '@/lib/api/backend'

export function useAffiliateLinks() {
  const [links, setLinks] = useState<AffiliateLinkRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminAffiliateApi.list()
      setLinks(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function create(dto: CreateAffiliateLinkPayload) {
    const created = await adminAffiliateApi.create(dto)
    setLinks(prev => [created, ...prev])
    return created
  }

  async function update(
    id: string,
    dto: Partial<CreateAffiliateLinkPayload & { is_active: boolean }>,
  ) {
    const updated = await adminAffiliateApi.update(id, dto)
    setLinks(prev => prev.map(l => (l.id === id ? { ...l, ...updated } : l)))
    return updated
  }

  async function remove(id: string) {
    await adminAffiliateApi.remove(id)
    setLinks(prev => prev.map(l => (l.id === id ? { ...l, is_active: false } : l)))
  }

  return { links, loading, error, refresh, create, update, remove }
}
