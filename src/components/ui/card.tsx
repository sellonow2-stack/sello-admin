import { cn } from '@/utils/cn'

interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-gray-800 bg-gray-900 p-6', className)}>
      {children}
    </div>
  )
}
