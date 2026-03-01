const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
  'bg-sky-500', 'bg-emerald-500', 'bg-amber-500',
]

export function getInitials(firstname: string | null, lastname: string | null): string {
  const f = firstname?.[0]?.toUpperCase() ?? ''
  const l = lastname?.[0]?.toUpperCase() ?? ''
  return (f + l) || '?'
}

export function getAvatarColor(userId: string): string {
  const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
