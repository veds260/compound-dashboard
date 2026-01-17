'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import PostApprovalSystem from '@/components/PostApprovalSystem'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function ClientPostsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'CLIENT') {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  if (status === 'loading' || !session) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent"></div>
        </div>
      </Layout>
    )
  }

  const initialFilter = searchParams.get('filter') || undefined

  return (
    <ErrorBoundary>
      <Layout>
        <PostApprovalSystem
          userRole="CLIENT"
          clientId={session.user.clientId}
          initialStatusFilter={initialFilter}
        />
      </Layout>
    </ErrorBoundary>
  )
}
