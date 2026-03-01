# CLAUDE.md — Dashboard Admin

Ce fichier guide Claude Code pour développer, maintenir et faire évoluer ce dashboard admin.
Il est la source de vérité pour toutes les conventions du projet.

---

## 🗂️ Structure du projet

```
/
├── src/
│   ├── pages/                  # Pages (une par route)
│   ├── components/
│   │   ├── ui/                 # Composants atomiques (Button, Input, Modal…)
│   │   ├── features/           # Composants métier (UserTable, StatsCard…)
│   │   └── layouts/            # Layouts réutilisables (Sidebar, Header…)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Supabase browser client (singleton)
│   │   │   └── types.ts        # Types générés depuis Supabase
│   │   └── api/                # Wrappers pour les API REST externes
│   ├── hooks/                  # Custom React hooks
│   ├── stores/                 # État global (Zustand)
│   ├── router/                 # Config React Router
│   │   └── index.tsx
│   ├── types/                  # Types TypeScript partagés
│   ├── utils/                  # Fonctions utilitaires pures
│   └── main.tsx
├── .env.local
├── vite.config.ts
└── CLAUDE.md
```

---

## ⚙️ Stack technique

| Couche | Technologie |
|---|---|
| Framework | React 18+ |
| Build tool | Vite |
| Language | TypeScript strict |
| Routing | React Router v6 |
| Base de données | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| API externes | fetch natif avec wrappers typés dans `src/lib/api/` |
| Styles | Tailwind CSS |
| État global | Zustand |
| Déploiement | Vercel |

---

## 🧩 Générer des composants UI

### Conventions

- Tous les composants sont en **TypeScript** avec des props typées explicitement.
- Les composants atomiques (`/components/ui/`) sont **sans logique métier** : ils reçoivent tout par props.
- Les composants features (`/components/features/`) peuvent contenir des hooks et appels de données.
- Utiliser les composants shadcn/ui comme base quand c'est pertinent.

### Template de composant

```tsx
// src/components/features/UserTable.tsx
interface UserTableProps {
  users: User[]
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function UserTable({ users, onDelete, isLoading = false }: UserTableProps) {
  if (isLoading) return <TableSkeleton />

  return (
    <table>
      {/* ... */}
    </table>
  )
}
```

### Règles

- ✅ Toujours typer les props (jamais de `any`)
- ✅ Named exports pour les composants réutilisables, default export pour les pages
- ✅ Gérer les états `loading`, `error`, `empty` dans chaque composant de liste
- ❌ Pas de logique de fetch dans les composants UI atomiques
- ❌ Pas de `console.log` en production

---

## 🗺️ Modifier le routing / pages

### Config React Router

```tsx
// src/router/index.tsx
import { createBrowserRouter } from 'react-router-dom'
import { AuthGuard } from '@/components/layouts/AuthGuard'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthGuard />,           // Vérifie la session Supabase
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'users/:id', element: <UserDetailPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
])
```

### AuthGuard pattern

```tsx
// src/components/layouts/AuthGuard.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '@/hooks/useSession'

export function AuthGuard() {
  const { session, isLoading } = useSession()

  if (isLoading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}
```

### Créer une nouvelle page

1. Créer `src/pages/NomDeLaPage.tsx`
2. Ajouter la route dans `src/router/index.tsx`
3. Ajouter l'entrée dans `src/components/layouts/Sidebar.tsx`

### Règles

- ✅ Une page = un fichier dans `src/pages/`
- ✅ Les pages fetchent leurs données via des hooks (`useUsers`, `useStats`…)
- ✅ Toutes les pages admin sont enfants de `AuthGuard`
- ❌ Pas de logique métier directement dans les pages — déléguer aux hooks et composants features

---

## 🗄️ Gérer les données / API

### Supabase — Client singleton

```ts
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### Pattern hook de données

```ts
// src/hooks/useUsers.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setUsers(data ?? [])
        setIsLoading(false)
      })
  }, [])

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) throw error
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  return { users, isLoading, error, deleteUser }
}
```

### API REST externes — Wrapper pattern

```ts
// src/lib/api/externalApi.ts
const BASE_URL = import.meta.env.VITE_EXTERNAL_API_URL

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_EXTERNAL_API_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`)
  return res.json()
}

export const externalApi = {
  getStats: () => apiFetch<StatsResponse>('/stats'),
  getOrders: (params: OrderParams) =>
    apiFetch<Order[]>(`/orders?${new URLSearchParams(params as Record<string, string>)}`),
}
```

### Variables d'environnement requises

```env
# .env.local  (ne jamais committer ce fichier)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_EXTERNAL_API_URL=
VITE_EXTERNAL_API_KEY=
```

> ⚠️ Avec Vite, toutes les variables exposées au client **doivent** commencer par `VITE_`.
> Il n'y a pas de couche serveur : ne jamais mettre de clés secrètes dans ces variables.
> Si une API nécessite une clé secrète, passer par un proxy (Edge Function Supabase ou Vercel Function).

### Règles

- ✅ Accès Supabase uniquement via le singleton `src/lib/supabase/client.ts`
- ✅ Toutes les API externes passent par les wrappers dans `src/lib/api/`
- ✅ La logique de fetch est dans les hooks, pas dans les composants
- ❌ Jamais de clé secrète dans les variables `VITE_*`
- ❌ Pas de fetch direct vers des API externes depuis les composants

---

## 🚀 Déployer / CI-CD

### Déploiement Vercel

Le projet est déployé automatiquement sur **Vercel** à chaque push sur `main`.

```bash
# Déploiement manuel si besoin
vercel --prod
```

La commande de build configurée dans Vercel :
```
npm run build   →   vite build
```

### Branches et environnements

| Branche | Environnement | URL |
|---|---|---|
| `main` | Production | `https://dashboard.monapp.com` |
| `develop` | Preview | URL Vercel automatique |
| `feature/*` | Preview | URL Vercel automatique |

### Variables d'environnement Vercel

Toujours synchroniser les variables dans **Vercel Dashboard > Settings > Environment Variables** après modification du `.env.local`.

Variables à configurer par environnement :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_EXTERNAL_API_URL`
- `VITE_EXTERNAL_API_KEY`

### Checklist avant merge sur `main`

- [ ] `npm run build` passe sans erreur localement
- [ ] `npm run lint` sans warning
- [ ] Les variables d'env sont à jour sur Vercel
- [ ] Les migrations Supabase sont appliquées en production
- [ ] La preview Vercel a été testée manuellement

### Migrations Supabase

```bash
# Créer une migration
supabase migration new nom_de_la_migration

# Appliquer en local
supabase db reset

# Appliquer en production
supabase db push
```

---

## 🤖 Instructions pour Claude Code

### Ce que tu peux faire sans demander

- Créer des composants dans `src/components/ui/` ou `src/components/features/`
- Ajouter des pages dans `src/pages/` et leur route dans `src/router/index.tsx`
- Créer des hooks dans `src/hooks/`
- Ajouter des wrappers API dans `src/lib/api/`
- Corriger des bugs TypeScript ou lint

### Ce que tu dois toujours demander avant de faire

- Modifier le schéma Supabase (migrations)
- Changer la logique d'authentification ou le `AuthGuard`
- Modifier les variables d'environnement
- Déployer en production

### Commandes utiles

```bash
npm run dev          # Démarrage local (Vite HMR)
npm run build        # Build de production
npm run preview      # Prévisualiser le build prod en local
npm run lint         # Vérification ESLint
npm run type-check   # Vérification TypeScript (tsc --noEmit)
supabase start       # Supabase local
supabase db push     # Appliquer migrations en prod
```

### Style de code attendu

- TypeScript strict, pas de `any`
- Composants fonctionnels uniquement
- Nommage : `PascalCase` pour les composants, `camelCase` pour fonctions/variables, `kebab-case` pour les noms de fichiers non-composants
- Imports absolus via alias `@/` (configuré dans `vite.config.ts`)
- Commentaires en **français** pour la logique métier, en **anglais** pour le code technique

## 📋 Cahier des charges

Le cahier des charges complet du projet est disponible dans `doc/CDC_SELLO.md`.
Claude Code doit s'y référer pour toute décision fonctionnelle ou architecturale.
```

---

### Étape 4 — Vérifier que Claude Code le lit

Dans ton terminal Claude Code :
```
/read docs/CDC_SELLO.md