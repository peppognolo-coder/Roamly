import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { RoamlyMark } from '@/components/ui/RoamlyMark'
import { useAuth } from '@/hooks/useAuth'
import { useResetPassword } from '@/hooks/useAuthActions'

// ============================================================
// ResetPasswordPage — /reset-password
// Si arriva dal link dell'email di recupero: Supabase crea una
// sessione "recovery" dall'URL. Rotta fuori da AuthGuard/GuestGuard
// (come /invito/:token), perché l'utente risulta già autenticato.
// Stessa regola password della registrazione.
// ============================================================

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Almeno 8 caratteri')
      .regex(/[A-Z]/, 'Almeno una lettera maiuscola')
      .regex(/[a-z]/, 'Almeno una lettera minuscola')
      .regex(/[0-9]/, 'Almeno un numero'),
    confirm_password: z.string().min(1, 'Conferma la password'),
  })
  .refine((d) => d.password === d.confirm_password, {
    path: ['confirm_password'],
    message: 'Le password non coincidono',
  })

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth()
  const { reset, isLoading, error, clearError } = useResetPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    clearError()
    await reset(data.password)
  }

  return (
    <div className="min-h-screen bg-roamly-bg flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[390px] flex flex-col gap-8">

        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-[18px] bg-roamly-g0 flex items-center justify-center shadow-roamly-lg">
            <RoamlyMark size={38} title="Roamly" />
          </div>
          <h1 className="font-lora text-3xl font-semibold text-roamly-g0 tracking-tight">Roamly</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-roamly-lg p-[22px]">
          {isLoadingAuth ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-roamly-g3 border-t-transparent animate-spin" />
            </div>
          ) : !isAuthenticated ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="font-lora text-lg font-semibold text-roamly-g0">Link non valido o scaduto</p>
              <p className="font-dm-sans text-sm text-roamly-ink-soft">
                Richiedi un nuovo link dalla schermata di accesso.
              </p>
              <Button variant="ghost" onClick={() => navigate('/login', { replace: true })}>
                Vai all'accesso
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <p className="font-lora text-lg font-semibold text-roamly-g0">Scegli una nuova password</p>
                <p className="font-dm-sans text-sm text-roamly-ink-soft">
                  Almeno 8 caratteri, con maiuscola, minuscola e un numero.
                </p>
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="font-dm-sans text-sm text-red-600">{error}</p>
                </div>
              )}

              <PasswordInput
                label="Nuova password"
                placeholder="••••••••"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <PasswordInput
                label="Conferma password"
                placeholder="••••••••"
                autoComplete="new-password"
                error={errors.confirm_password?.message}
                {...register('confirm_password')}
              />

              <Button onClick={handleSubmit(onSubmit)} isLoading={isLoading} fullWidth size="lg">
                Salva password
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
