import { ReactNode } from 'react'
import { AuthGuard } from '@/components/auth'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <AuthGuard redirectTo="/">
      {children}
    </AuthGuard>
  )
}
