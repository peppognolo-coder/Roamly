import { supabase } from '@/lib/supabase'

// ============================================================
// ROAMLY — Push Service
// Salvataggio/rimozione delle subscription push su Supabase.
// ============================================================

export async function salvaSubscription(
  userId: string,
  subscription: PushSubscription
): Promise<{ error: string | null }> {
  const json = subscription.toJSON()
  const keys = json.keys

  if (!json.endpoint || !keys?.p256dh || !keys?.auth) {
    return { error: 'Subscription push incompleta' }
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id:    userId,
        endpoint:   json.endpoint,
        p256dh:     keys.p256dh,
        auth_key:   keys.auth,
        user_agent: navigator.userAgent,
      },
      { onConflict: 'endpoint' }
    )

  if (error) return { error: error.message }
  return { error: null }
}

export async function rimuoviSubscription(endpoint: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)

  if (error) return { error: error.message }
  return { error: null }
}
