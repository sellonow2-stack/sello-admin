import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useSession } from '@/hooks/useSession'

export function AuthGuard() {
  const { session, isLoading: sessionLoading } = useSession()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (!session) {
      setIsAdmin(null)
      return
    }

    // Vérifie le rôle admin sur le profil de l'utilisateur connecté
    supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.role === 'admin')
      })
  }, [session])

  // Chargement session
  if (sessionLoading) return <FullPageSpinner />

  // Pas de session → login
  if (!session) return <Navigate to="/login" replace />

  // Session présente mais rôle pas encore vérifié
  if (isAdmin === null) return <FullPageSpinner />

  // Connecté mais pas admin → déconnexion + login
  if (!isAdmin) {
    supabase.auth.signOut()
    return <Navigate to="/login?error=not_admin" replace />
  }

  return <Outlet />
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-gray-700 border-t-indigo-500 animate-spin" />
    </div>
  )
}
