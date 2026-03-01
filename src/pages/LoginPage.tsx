import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'not_admin'
      ? "Ce compte n'a pas les droits administrateur."
      : null,
  )

  // Si déjà connecté + admin → redirection directe
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single()
      if (data?.role === 'admin') navigate('/dashboard', { replace: true })
    })
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Email ou mot de passe incorrect.')
      setIsLoading(false)
      return
    }

    // Vérification du rôle admin
    const { data: session } = await supabase.auth.getSession()
    const userId = session.session?.user.id

    if (!userId) {
      setError('Erreur de session.')
      setIsLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut()
      setError("Ce compte n'a pas les droits administrateur.")
      setIsLoading(false)
      return
    }

    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <span className="text-white font-semibold text-lg">Sello</span>
            <span className="text-gray-500 text-sm block -mt-0.5">Admin Dashboard</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8">
          <h1 className="text-xl font-bold text-white mb-1">Connexion</h1>
          <p className="text-sm text-gray-500 mb-6">Accès réservé aux administrateurs</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="admin@sello.fr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-800 bg-red-950/50 px-3.5 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isLoading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
