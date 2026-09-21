import { supabase } from '@/lib/supabase'
import type { BudgetVoce, NuovaBudgetVoce, ModificaBudgetVoce, BudgetPagamento, NuovoBudgetPagamento } from '@/types'

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

// `payload.user_id` è chi ha pagato — se assente, default a chi
// registra la spesa (submitterId). Possono differire: il form lascia
// scegliere "Ha pagato" tra i membri del viaggio quando è condiviso
// (vedi RLS in supabase-migration-spese-gruppo.sql: chi registra deve
// comunque essere un membro del viaggio, non deve coincidere col pagante).
export async function createBudgetVoce(
  submitterId: string,
  payload: NuovaBudgetVoce
): Promise<{ data: BudgetVoce | null; error: string | null }> {
  const { data, error } = await supabase
    .from('budget_voci')
    .insert({ ...payload, user_id: payload.user_id ?? submitterId })
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

// ------------------------------------------------------------
// Pareggi tra membri (settle-up) — budget_pagamenti
// ------------------------------------------------------------

export async function getBudgetPagamenti(viaggioId: string): Promise<{
  data: BudgetPagamento[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('budget_pagamenti')
    .select('*')
    .eq('viaggio_id', viaggioId)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: data as BudgetPagamento[], error: null }
}

export async function createBudgetPagamento(
  registratoDa: string,
  payload: NuovoBudgetPagamento
): Promise<{ data: BudgetPagamento | null; error: string | null }> {
  const { data, error } = await supabase
    .from('budget_pagamenti')
    .insert({ ...payload, registrato_da: registratoDa })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as BudgetPagamento, error: null }
}
