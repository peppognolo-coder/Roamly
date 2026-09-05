import { supabase } from '@/lib/supabase'
import type { BudgetVoce, NuovaBudgetVoce, ModificaBudgetVoce } from '@/types'

// ============================================================
// ROAMLY — Budget Service
// Responsabilità: chiamate alla tabella `budget_voci`.
// ============================================================

export async function getBudgetVoci(viaggioId: string): Promise<{
  data: BudgetVoce[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('budget_voci')
    .select('*')
    .eq('viaggio_id', viaggioId)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: data as BudgetVoce[], error: null }
}

export async function createBudgetVoce(
  userId: string,
  payload: NuovaBudgetVoce
): Promise<{ data: BudgetVoce | null; error: string | null }> {
  const { data, error } = await supabase
    .from('budget_voci')
    .insert({ user_id: userId, ...payload })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as BudgetVoce, error: null }
}

export async function updateBudgetVoce(
  voceId: string,
  payload: ModificaBudgetVoce
): Promise<{ data: BudgetVoce | null; error: string | null }> {
  const { data, error } = await supabase
    .from('budget_voci')
    .update(payload)
    .eq('id', voceId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as BudgetVoce, error: null }
}

export async function deleteBudgetVoce(
  voceId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('budget_voci')
    .delete()
    .eq('id', voceId)

  return { error: error?.message ?? null }
}
