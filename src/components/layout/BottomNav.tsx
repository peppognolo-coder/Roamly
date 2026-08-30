import { NavLink } from 'react-router-dom'
import { FAB } from './FAB'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function DiarioIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="11" x2="15" y2="11" />
    </svg>
  )
}

function PianificaIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  )
}

function ProfiloIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

const navItems: NavItem[] = [
  { to: '/',          label: 'Home',     icon: <HomeIcon /> },
  { to: '/diario',    label: 'Diario',   icon: <DiarioIcon /> },
  // slot centrale vuoto per FAB
  { to: '/pianifica', label: 'Pianifica',icon: <PianificaIcon /> },
  { to: '/profilo',   label: 'Profilo',  icon: <ProfiloIcon /> },
]

export function BottomNav() {
  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-40
      flex justify-center
      pointer-events-none
    ">
      <div className="
        w-full max-w-[430px]
        bg-roamly-bg/95 backdrop-blur-sm
        shadow-[0_-4px_20px_-4px_rgba(12,42,61,0.10)]
        grid grid-cols-5 items-center
        h-20 px-2
        pointer-events-auto
      ">
        {/* Home + Diario */}
        {navItems.slice(0, 2).map((item) => (
          <NavTabItem key={item.to} item={item} />
        ))}

        {/* Slot centrale FAB — colonna dedicata, sempre al centro esatto */}
        <div className="relative flex items-center justify-center">
          <FAB />
        </div>

        {/* Pianifica + Profilo */}
        {navItems.slice(2).map((item) => (
          <NavTabItem key={item.to} item={item} />
        ))}
      </div>
    </nav>
  )
}

function NavTabItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) => `
        flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl
        transition-colors duration-150
        ${isActive
          ? 'text-roamly-g1'
          : 'text-roamly-text/40 hover:text-roamly-text/60'
        }
      `}
    >
      {({ isActive }) => (
        <>
          <span className="relative">
            {isActive && (
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-roamly-g3" />
            )}
            <span className={isActive ? 'scale-105 transition-transform block' : 'block'}>
              {item.icon}
            </span>
          </span>
          <span className="text-[10px] font-dm-sans font-medium tracking-wide">
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  )
}
