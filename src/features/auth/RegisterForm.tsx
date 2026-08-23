import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useRegister } from '@/hooks/useAuthActions'

// ============================================================
// Schema Zod — Registrazione
// Password: min 8 car., almeno 1 maiuscola, 1 minuscola, 1 numero
// ============================================================

const passwordSchema = z
  .string()
  .min(8, 'Almeno 8 caratteri')
  .regex(/[A-Z]/, 'Almeno una lettera maiuscola')
  .regex(/[a-z]/, 'Almeno una lettera minuscola')
  .regex(/[0-9]/, 'Almeno un numero')

const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, 'Il nome deve avere almeno 2 caratteri')
      .max(40, 'Il nome non può superare 40 caratteri')
      .trim(),
    email: z
      .string()
      .min(1, 'L\'email è obbligatoria')
      .email('Inserisci un\'email valida'),
    password: passwordSchema,
    confirm_password: z.string().min(1, 'Conferma la password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Le password non coincidono',
  })

type RegisterFormData = z.infer<typeof registerSchema>

// ============================================================
// EmailSentState — schermata di conferma dopo registrazione
// ============================================================

function EmailSentState({ email }: { email: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="w-16 h-16 rounded-full bg-roamly-g6 flex items-center justify-center">
        <span className="text-3xl">📬</span>
      </div>
      <div>
        <h3 className="font-lora text-xl font-semibold text-roamly-g0">
          Controlla la tua email
        </h3>
        <p className="font-dm-sans text-sm text-roamly-text/60 mt-2 leading-relaxed">
          Abbiamo inviato un link di conferma a{' '}
          <span className="font-medium text-roamly-text">{email}</span>.
          <br />
          Clicca il link per attivare il tuo account.
        </p>
      </div>
      <p className="font-dm-sans text-xs text-roamly-text/40">
        Non trovi l'email? Controlla la cartella spam.
      </p>
    </div>
  )
}

// ============================================================
// PasswordStrengthHint — suggerimenti visivi sulla password
// ============================================================

function PasswordStrengthHint({ password }: { password: string }) {
  const checks = [
    { label: '8+ caratteri',    ok: password.length >= 8 },
    { label: 'Maiuscola',       ok: /[A-Z]/.test(password) },
    { label: 'Minuscola',       ok: /[a-z]/.test(password) },
    { label: 'Numero',          ok: /[0-9]/.test(password) },
  ]

  if (!password) return null

  return (
    <div className="flex gap-2 flex-wrap mt-1">
      {checks.map((c) => (
        <span
          key={c.label}
          className={`
            inline-flex items-center gap-1
            px-2 py-0.5 rounded-full
            font-dm-mono text-[10px]
            transition-colors duration-200
            ${c.ok
              ? 'bg-roamly-g6 text-roamly-g1'
              : 'bg-roamly-text/5 text-roamly-text/30'
            }
          `}
        >
          <span>{c.ok ? '✓' : '·'}</span>
          {c.label}
        </span>
      ))}
    </div>
  )
}

// ============================================================
// RegisterForm
// ============================================================

export function RegisterForm() {
  const { register: doRegister, isLoading, error, emailSent, clearError } = useRegister()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const passwordValue = watch('password', '')
  const emailValue = watch('email', '')

  async function onSubmit(data: RegisterFormData) {
    clearError()
    await doRegister(data.email, data.password, data.full_name)
  }

  if (emailSent) {
    return <EmailSentState email={emailValue} />
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
          label="Nome"
          type="text"
          placeholder="Il tuo nome"
          autoComplete="name"
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="la@tua.email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="flex flex-col gap-1">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordStrengthHint password={passwordValue} />
        </div>
        <Input
          label="Conferma password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />
      </div>

      <Button
        onClick={handleSubmit(onSubmit)}
        isLoading={isLoading}
        fullWidth
        size="lg"
      >
        Crea account
      </Button>
    </div>
  )
}
