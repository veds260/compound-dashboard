'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (session) {
      if (session.user.role === 'AGENCY' || session.user.role === 'ADMIN') {
        router.push('/dashboard')
      } else {
        router.push('/client')
      }
    } else {
      // Redirect to login for non-logged-in users
      router.push('/login')
    }
  }, [session, status, router])

  // Show loading spinner while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  )
}