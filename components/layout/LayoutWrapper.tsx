'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { ReactNode } from 'react'

interface LayoutWrapperProps {
  children: ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const showNavbar = pathname !== '/'

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  )
}
