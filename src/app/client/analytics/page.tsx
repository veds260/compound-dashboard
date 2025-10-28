'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

export default function ClientAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">Your Analytics</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400">
            View your Twitter performance data
          </p>
        </div>

        {session.user.clientId ? (
          <AnalyticsDashboard clientId={session.user.clientId} />
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400">No analytics data available</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}