const BASE_URL = import.meta.env.VITE_BACKEND_URL as string

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${text}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export interface PlanRecord {
  id: number
  name: string
  code: string | null
  price_cents: number
  currency: string
  billing_period: string | null
  included_ai_images_per_month: number
  included_text_announcements_per_week: number
  export_enabled: boolean
  ai_image_generation_enabled: boolean
  marketplace_connections_limit: number
  history_limit: number
  max_images_per_listing: number
  stripe_price_id: string | null
  stripe_product_id: string | null
  is_custom: boolean
  created_at: string
}

export interface CreatePlanPayload {
  name: string
  code?: string
  amount: number
  currency: string
  billing_period?: 'monthly' | 'yearly'
  description?: string
  ai_image_generation_enabled?: boolean
  export_enabled?: boolean
  included_ai_images_per_month?: number
  included_text_announcements_per_week?: number
  marketplace_connections_limit?: number
  history_limit?: number
  max_images_per_listing?: number
  is_custom?: boolean
}

export type UpdatePlanPayload = Partial<Omit<CreatePlanPayload, 'amount'> & { price_cents: number }>

interface StripePriceRef {
  id: string
  unit_amount: number | null
  currency: string
}

export const adminPlansApi = {
  list: () => apiFetch<PlanRecord[]>('/admin/plans'),
  get: (id: string) => apiFetch<PlanRecord>(`/admin/plans/${id}`),
  create: (dto: CreatePlanPayload) =>
    apiFetch<PlanRecord>('/admin/plans', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  update: (id: number, dto: UpdatePlanPayload) =>
    apiFetch<PlanRecord>(`/admin/plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),
  archive: (id: number) =>
    apiFetch<void>(`/admin/plans/${id}`, { method: 'DELETE' }),
}

// ─── Stripe Subscriptions ─────────────────────────────────────────────────────

export const adminSubscriptionsApi = {
  list: () =>
    apiFetch<{
      id: string
      status: string
      customer: { id: string; name: string; email: string } | string
      plan: StripePriceRef | null
      currentPeriodStart: string
      currentPeriodEnd: string
      cancelAtPeriodEnd: boolean
    }[]>('/admin/subscriptions'),

  update: (stripeSubId: string, priceId: string) =>
    apiFetch<unknown>(`/admin/subscriptions/${stripeSubId}`, {
      method: 'PATCH',
      body: JSON.stringify({ priceId }),
    }),

  cancel: (stripeSubId: string, cancelAtPeriodEnd = true) =>
    apiFetch<unknown>(`/admin/subscriptions/${stripeSubId}`, {
      method: 'DELETE',
      body: JSON.stringify({ cancelAtPeriodEnd }),
    }),

  create: (customerId: string, priceId: string) =>
    apiFetch<unknown>('/admin/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ customerId, priceId }),
    }),
}

// ─── Stripe Customers ─────────────────────────────────────────────────────────

export const adminCustomersApi = {
  list: () =>
    apiFetch<{ id: string; name: string | null; email: string | null }[]>('/admin/customers'),

  get: (id: string) =>
    apiFetch<{ id: string; name: string | null; email: string | null }>(`/admin/customers/${id}`),

  create: (name: string, email: string) =>
    apiFetch<{ id: string }>('/admin/customers', {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    }),
}
