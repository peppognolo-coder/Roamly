import { useNavigate } from 'react-router-dom'

export function FAB() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/nuovo-ricordo')}
      aria-label="Nuovo ricordo"
      className="
        absolute -top-6
        w-14 h-14 rounded-full
        bg-roamly-g0 hover:bg-roamly-g1
        shadow-lg shadow-roamly-g0/30
        flex items-center justify-center
        transition-all duration-200
        active:scale-95
        focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
      "
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  )
}
