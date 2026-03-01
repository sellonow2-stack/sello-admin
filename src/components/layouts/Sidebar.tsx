import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart2,
  Users,
  CreditCard,
  Wand2,
  HeartHandshake,
  LogOut,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { supabase } from '@/lib/supabase/client'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Vue Macro',
    icon: LayoutDashboard,
    module: '01',
  },
  {
    to: '/analytics',
    label: 'Usage IA',
    icon: BarChart2,
    module: '02',
  },
  {
    to: '/users',
    label: 'Utilisateurs',
    icon: Users,
    module: '03',
  },
  {
    to: '/plans',
    label: 'Plans & Paiements',
    icon: CreditCard,
    module: '06',
  },
  {
    to: '/prompts',
    label: 'IA & Prompts',
    icon: Wand2,
    module: '04',
  },
  {
    to: '/support',
    label: 'Support',
    icon: HeartHandshake,
    module: '05',
  },
]

export function Sidebar() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-gray-900 border-r border-gray-800 flex flex-col z-20">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <span className="text-white font-semibold text-sm">Sello</span>
            <span className="text-gray-500 text-xs block -mt-0.5">Admin</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={16}
                  className={cn(
                    isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300',
                  )}
                />
                <span className="flex-1 font-medium">{item.label}</span>
                <span
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0.5 rounded',
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'bg-gray-800 text-gray-600',
                  )}
                >
                  {item.module}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer group"
        >
          <LogOut size={16} className="text-gray-500 group-hover:text-red-400" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
