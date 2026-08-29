import { useState } from 'react'
import { LoginForm }   from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { OAuthButton }  from './OAuthButton'

// ============================================================
// AuthPage — schermata di login/registrazione
// Tab switcher locale (useState) — nessun bisogno di Zustand.
// GuestGuard nel router impedisce l'accesso se già autenticati.
// ============================================================

type Tab = 'login' | 'register'

export function AuthPage() {
  const [activeTab, setActiveTab] = useState<Tab>('login')

  return (
    <div className="min-h-screen bg-roamly-bg flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[390px] flex flex-col gap-8">

        {/* Logo + tagline */}
        <div className="flex flex-col items-center gap-4">
          <div className="
            w-16 h-16 rounded-2xl
            bg-roamly-g0
            flex items-center justify-center
            shadow-roamly-lg
          ">
            <img src="/favicon.svg" alt="Roamly" className="w-10 h-10" />
          </div>
          <div className="text-center">
            <h1 className="font-lora text-3xl font-semibold text-roamly-g0 tracking-tight">
              Roamly
            </h1>
            <p className="font-dm-sans text-sm text-roamly-text/50 mt-1">
              Conserva ogni viaggio. Rivivilo quando vuoi.
            </p>
          </div>
        </div>

        {/* Card auth */}
        <div className="bg-white rounded-3xl shadow-roamly-lg overflow-hidden">

          {/* Tab switcher */}
          <div className="flex border-b border-roamly-g6">
            <TabButton
              label="Accedi"
              active={activeTab === 'login'}
              onClick={() => setActiveTab('login')}
            />
            <TabButton
              label="Registrati"
              active={activeTab === 'register'}
              onClick={() => setActiveTab('register')}
            />
          </div>

          {/* Form */}
          <div className="p-6">
            {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>

          {/* Divider */}
          <div className="px-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-roamly-g6" />
              <span className="font-dm-sans text-xs text-roamly-text/30 shrink-0">
                oppure
              </span>
              <div className="flex-1 h-px bg-roamly-g6" />
            </div>
          </div>

          {/* OAuth */}
          <div className="px-6 pb-6 pt-2">
            <OAuthButton />
          </div>
        </div>

        {/* Footer */}
        <p className="font-dm-sans text-xs text-center text-roamly-text/30">
          Usando Roamly accetti i Termini di servizio e la Privacy policy.
        </p>

      </div>
    </div>
  )
}

// ------------------------------------------------------------
// TabButton
// ------------------------------------------------------------

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 py-4
        font-dm-sans font-medium text-sm
        transition-colors duration-150
        focus:outline-none
        border-b-2
        ${active
          ? 'text-roamly-g0 border-roamly-g0'
          : 'text-roamly-text/40 border-transparent hover:text-roamly-text/60'
        }
      `}
    >
      {label}
    </button>
  )
}
