import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Camera } from 'lucide-react'
import { PageLayout }         from '@/components/layout/PageLayout'
import { PageHeader }         from '@/components/layout/PageHeader'
import { AnimatedPage }       from '@/components/layout/AnimatedPage'
import { Button }             from '@/components/ui/Button'
import { Input }              from '@/components/ui/Input'
import { useAuth }            from '@/hooks/useAuth'
import { useProfilo, useAggiornaProfilo, useUploadAvatar } from '@/hooks/useProfilo'
import { useLogout, useDeleteAccount } from '@/hooks/useAuthActions'

// ============================================================
// Schema Zod — Aggiornamento profilo
// ============================================================

const profiloSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Il nome deve avere almeno 2 caratteri')
    .max(40, 'Il nome non può superare 40 caratteri')
    .trim(),
  bio: z
    .string()
    .max(150, 'La bio non può superare 150 caratteri')
    .optional()
    .or(z.literal('')),
})

type ProfiloFormData = z.infer<typeof profiloSchema>

// ============================================================
// ImpostazioniAccountPage — /profilo/impostazioni
// Foto profilo, nome, bio, info account, logout, elimina account.
// ============================================================

export function ImpostazioniAccountPage() {
  const { user } = useAuth()
  const { data: profilo, isLoading: isLoadingProfilo } = useProfilo()
  const { mutateAsync: aggiorna, isPending: isUpdating } = useAggiornaProfilo()
  const { uploadAvatar, isLoading: isUploadingAvatar, error: avatarError } = useUploadAvatar()
  const { logout, isLoading: isLoggingOut } = useLogout()
  const { deleteAccount, isLoading: isDeletingAccount, error: deleteAccountError } = useDeleteAccount()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [updateError, setUpdateError]     = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfiloFormData>({
    resolver: zodResolver(profiloSchema),
    values: {
      display_name: profilo?.display_name ?? '',
      bio: profilo?.bio ?? '',
    },
  })

  async function onSubmit(data: ProfiloFormData) {
    setUpdateError(null)
    setUpdateSuccess(false)

    const result = await aggiorna({
      display_name: data.display_name,
      bio: data.bio || null,
    })

    if (result.error) {
      setUpdateError('Impossibile salvare le modifiche. Riprova.')
    } else {
      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 3000)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadAvatar(file)
    e.target.value = '' // permette di riselezionare lo stesso file
  }

  async function handleDeleteAccount() {
    if (!user) return
    await deleteAccount(user.id)
  }

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">

        <PageHeader title="Impostazioni account" variant="withBack" />

        <div className="flex-1 px-5 flex flex-col gap-6">

          {/* Foto profilo */}
          <div className="flex flex-col items-center gap-3 py-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="relative group focus:outline-none"
              aria-label="Cambia foto profilo"
            >
              <AvatarGrande
                url={profilo?.avatar_url}
                displayName={profilo?.display_name}
                isLoading={isLoadingProfilo}
              />
              <span className="
                absolute bottom-0 right-0
                w-8 h-8 rounded-full
                bg-roamly-coral shadow-roamly-lg
                flex items-center justify-center
                text-white
                border-2 border-white
              ">
                {isUploadingAvatar ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {avatarError && (
              <p className="font-dm-sans text-xs text-red-500 text-center">{avatarError}</p>
            )}
            <p className="font-dm-sans text-sm text-roamly-text/40">
              {user?.email}
            </p>
          </div>

          {/* Form modifica nome + bio */}
          <div className="bg-white rounded-2xl shadow-roamly p-5 flex flex-col gap-4">
            <h2 className="font-dm-sans font-semibold text-sm text-roamly-text/60 uppercase tracking-wider">
              Informazioni personali
            </h2>

            {updateError && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="font-dm-sans text-sm text-red-600">{updateError}</p>
              </div>
            )}
            {updateSuccess && (
              <div className="px-4 py-3 bg-roamly-g6 border border-roamly-g5 rounded-xl flex items-center gap-2">
                <Check size={15} className="text-roamly-g1 shrink-0" />
                <p className="font-dm-sans text-sm text-roamly-g1">
                  Profilo aggiornato
                </p>
              </div>
            )}

            <Input
              label="Nome visualizzato"
              type="text"
              placeholder="Il tuo nome"
              autoComplete="name"
              error={errors.display_name?.message}
              {...register('display_name')}
            />

            <div className="flex flex-col gap-2">
              <label className="font-dm-sans text-sm font-medium text-roamly-text/70">
                Bio <span className="text-roamly-text/35 font-normal">(opzionale)</span>
              </label>
              <textarea
                {...register('bio')}
                rows={3}
                placeholder="Racconta qualcosa di te e del tuo modo di viaggiare..."
                className="
                  w-full px-4 py-3
                  bg-roamly-g7 border border-roamly-g5
                  rounded-2xl resize-none
                  font-dm-sans text-sm text-roamly-text
                  placeholder:text-roamly-text/30
                  focus:outline-none focus:ring-2 focus:ring-roamly-g3 focus:border-transparent
                "
              />
              {errors.bio && (
                <p className="font-dm-sans text-xs text-red-500">{errors.bio.message}</p>
              )}
            </div>

            <Button
              onClick={handleSubmit(onSubmit)}
              isLoading={isUpdating}
              disabled={!isDirty || isUpdating}
              fullWidth
            >
              Salva modifiche
            </Button>
          </div>

          {/* Info account */}
          <div className="bg-white rounded-2xl shadow-roamly p-5 flex flex-col gap-3">
            <h2 className="font-dm-sans font-semibold text-sm text-roamly-text/60 uppercase tracking-wider">
              Account
            </h2>

            <div className="flex flex-col gap-2">
              <InfoRow label="Email" value={user?.email ?? '—'} />
              <InfoRow
                label="Membro dal"
                value={
                  user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '—'
                }
              />
              <InfoRow
                label="Provider"
                value={user?.app_metadata?.provider === 'google' ? 'Google' : 'Email'}
              />
            </div>
          </div>

        </div>

        {/* Logout */}
        <div className="px-5 pt-4 pb-3">
          <Button
            variant="ghost"
            fullWidth
            onClick={logout}
            isLoading={isLoggingOut}
            className="text-red-500 hover:bg-red-50"
          >
            Esci dall'account
          </Button>
        </div>

        {/* Danger zone — elimina account */}
        <div className="px-5 pb-8">
          {deleteAccountError && (
            <p className="font-dm-sans text-sm text-red-500 mb-3 text-center">
              {deleteAccountError}
            </p>
          )}
          {!showDeleteConfirm ? (
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-500/70 hover:bg-red-50 hover:text-red-500"
            >
              Elimina account
            </Button>
          ) : (
            <div className="flex flex-col gap-2 bg-red-50 rounded-2xl p-4">
              <p className="font-dm-sans text-sm font-medium text-red-600">
                Tutti i tuoi viaggi, ricordi e foto verranno eliminati per sempre.
                Questa azione non può essere annullata.
              </p>
              <div className="flex gap-2 mt-1">
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                  disabled={isDeletingAccount}
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  isLoading={isDeletingAccount}
                  className="flex-1 !bg-red-500 hover:!bg-red-600"
                >
                  Elimina per sempre
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
      </AnimatedPage>
    </PageLayout>
  )
}

// ------------------------------------------------------------
// AvatarGrande — foto profilo o iniziali, versione grande
// ------------------------------------------------------------

function AvatarGrande({
  url,
  displayName,
  isLoading,
}: {
  url: string | null | undefined
  displayName: string | null | undefined
  isLoading: boolean
}) {
  const initials = displayName
    ? displayName.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  if (isLoading) {
    return <div className="w-20 h-20 rounded-full bg-roamly-g6 animate-pulse" />
  }

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="w-20 h-20 rounded-full object-cover shadow-roamly-lg"
      />
    )
  }

  return (
    <div className="
      w-20 h-20 rounded-full
      bg-roamly-g0
      flex items-center justify-center
      shadow-roamly-lg
    ">
      <span className="font-lora text-2xl font-semibold text-white">
        {initials}
      </span>
    </div>
  )
}

// ------------------------------------------------------------
// InfoRow
// ------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-roamly-g6 last:border-0">
      <span className="font-dm-sans text-sm text-roamly-text/50">{label}</span>
      <span className="font-dm-sans text-sm text-roamly-text font-medium">{value}</span>
    </div>
  )
}
