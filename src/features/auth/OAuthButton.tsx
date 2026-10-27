import { useOAuth } from '@/hooks/useAuthActions'

// ============================================================
// OAuthButton — Pulsante "Continua con Google"
// ============================================================

export function OAuthButton() {
  const { signInWithGoogle, signInWithApple, isLoading, error } = useOAuth()
  const conApple = import.meta.env.VITE_APPLE_LOGIN === 'true'

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={signInWithGoogle}
        disabled={isLoading}
        className="
          w-full h-[50px] px-4
          flex items-center justify-center gap-2.5
          bg-white border border-roamly-g5
          rounded-full
          font-dm-sans font-medium text-sm text-roamly-text
          hover:bg-roamly-g7 hover:border-roamly-g4
          active:scale-[0.99]
          transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
        "
      >
        {isLoading ? (
          <span className="w-4 h-4 rounded-full border-2 border-roamly-g3 border-t-transparent animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        <span>Continua con Google</span>
      </button>

      {conApple && (
        <button
          onClick={signInWithApple}
          disabled={isLoading}
          className="
            w-full h-[50px] px-4
            flex items-center justify-center gap-2.5
            bg-black border border-black
            rounded-full
            font-dm-sans font-medium text-sm text-white
            active:scale-[0.99]
            transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
          "
        >
          <AppleIcon />
          <span>Continua con Apple</span>
        </button>
      )}

      {error && (
        <p className="text-xs text-center font-dm-sans text-red-600">{error}</p>
      )}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.37 1.43c0 1.14-.46 2.22-1.2 3.01-.8.85-2.1 1.5-3.16 1.42-.13-1.1.42-2.25 1.15-3 .82-.85 2.2-1.46 3.21-1.43zM20.5 17.1c-.55 1.27-.82 1.84-1.53 2.96-1 1.56-2.4 3.5-4.14 3.52-1.55.02-1.95-1-4.05-.99-2.1.01-2.54 1.01-4.09.99-1.74-.02-3.07-1.77-4.07-3.33C-.18 15.9-.47 11.3 1.3 8.7c1.25-1.85 3.23-2.93 5.09-2.93 1.89 0 3.08 1.03 4.64 1.03 1.52 0 2.44-1.03 4.63-1.03 1.65 0 3.4.9 4.64 2.45-4.07 2.23-3.41 8.05.2 8.88z" />
    </svg>
  )
}
