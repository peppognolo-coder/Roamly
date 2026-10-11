import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useForgotPassword } from '@/hooks/useAuthActions'

// ============================================================
// ForgotPasswordForm — "Password dimenticata?"
// Email → link di recupero (Supabase) → /reset-password.
// ============================================================

const schema = z.object({
  email: z
    .string()
    .min(1, 'L\'email è obbligatoria')
    .email('Inserisci un\'email valida'),
})

type FormData = z.infer<typeof schema>

interface ForgotPasswordFormProps {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const { sendReset, isLoading, error, emailSent, clearError } = useForgotPassword()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const emailValue = watch('email', '')

  async function onSubmit(data: FormData) {
    clearError()
    await sendReset(data.email)
  }

  if (emailSent) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-roamly-g6 flex items-center justify-center">
          <Mail size={26} className="text-roamly-g2" />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="font-lora text-lg font-semibold text-roamly-g0">Controlla la posta</p>
          <p className="font-dm-sans text-sm text-roamly-ink-soft">
            Se <span className="font-medium text-roamly-ink">{emailValue}</span> ha un account,
            troverai un link per scegliere una nuova password.
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          Torna all'accesso
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="font-lora text-lg font-semibold text-roamly-g0">Password dimenticata?</p>
        <p className="font-dm-sans text-sm text-roamly-ink-soft">
          Scrivi la tua email: ti mandiamo un link per sceglierne una nuova.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-dm-sans text-sm text-red-600">{error}</p>
        </div>
      )}

      <Input
        label="Email"
        type="email"
        placeholder="la@tua.email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Button onClick={handleSubmit(onSubmit)} isLoading={isLoading} fullWidth size="lg">
        Invia il link
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="self-center font-dm-sans text-[12.5px] font-medium text-roamly-g3 hover:text-roamly-g1 focus:outline-none"
      >
        Torna all'accesso
      </button>
    </div>
  )
}
