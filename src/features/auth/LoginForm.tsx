import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useLogin } from '@/hooks/useAuthActions'

// ============================================================
// Schema Zod — Login
// ============================================================

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email è obbligatoria')
    .email('Inserisci un\'email valida'),
  password: z
    .string()
    .min(1, 'La password è obbligatoria'),
})

type LoginFormData = z.infer<typeof loginSchema>

// ============================================================
// LoginForm
// ============================================================

export function LoginForm() {
  const { login, isLoading, error, clearError } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    clearError()
    await login(data.email, data.password)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Errore globale Supabase */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-dm-sans text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="la@tua.email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
      </div>

      <Button
        onClick={handleSubmit(onSubmit)}
        isLoading={isLoading}
        fullWidth
        size="lg"
      >
        Accedi
      </Button>
    </div>
  )
}
