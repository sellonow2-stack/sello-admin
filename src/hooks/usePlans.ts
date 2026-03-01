import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { adminPlansApi } from '@/lib/api/backend'

export interface Plan {
  id: number
  name: string
  code: string | null
  price_cents: number
  currency: string
  billing_period: 'monthly' | 'yearly' | null
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

export type PlanInput = {
  name: string
  code: string
  price_cents: number
  currency: string
  billing_period: 'monthly' | 'yearly'
  included_ai_images_per_month: number
  included_text_announcements_per_week: number
  export_enabled: boolean
  ai_image_generation_enabled: boolean
  marketplace_connections_limit: number
  history_limit: number
  max_images_per_listing: number
  is_custom: boolean
  description?: string
}

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('plans')
      .select('*')
      .order('price_cents', { ascending: true })
    if (err) {
      setError(err.message)
    } else {
      setPlans((data ?? []) as Plan[])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const createPlan = async (input: PlanInput) => {
    await adminPlansApi.create({
      name: input.name,
      code: input.code || undefined,
      amount: input.price_cents,
      currency: input.currency.toLowerCase(),
      billing_period: input.billing_period,
      description: input.description,
      ai_image_generation_enabled: input.ai_image_generation_enabled,
      export_enabled: input.export_enabled,
      included_ai_images_per_month: input.included_ai_images_per_month,
      included_text_announcements_per_week: input.included_text_announcements_per_week,
      marketplace_connections_limit: input.marketplace_connections_limit,
      history_limit: input.history_limit,
      max_images_per_listing: input.max_images_per_listing,
      is_custom: input.is_custom,
    })
    await load()
  }

  const updatePlan = async (id: number, input: Partial<Omit<Plan, 'id' | 'created_at' | 'stripe_price_id' | 'stripe_product_id'>>) => {
    await adminPlansApi.update(id, {
      ...input,
      code: input.code ?? undefined,
      billing_period: input.billing_period ?? undefined,
    })
    await load()
  }

  const archivePlan = async (plan: Plan) => {
    await adminPlansApi.archive(plan.id)
    await load()
  }

  return { plans, isLoading, error, createPlan, updatePlan, archivePlan, reload: load }
}
