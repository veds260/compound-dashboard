'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface ClientInfo {
  id: string
  name: string
  email: string
  twitterHandle?: string
}

export default function AdminClientAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchClientInfo()
  }, [session, status, router, clientId])

  const fetchClientInfo = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setClientInfo(data)
      } else {
        console.error('Failed to fetch client info')
      }
    } catch (error) {
      console.error('Error fetching client info:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
        </div>
      </Layout>
    )
  }

  if (!clientInfo) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Client not found.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/analytics')}
            className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to System Analytics
          </button>
        </div>

        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl">
              {clientInfo.name} - Analytics
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {clientInfo.email} {clientInfo.twitterHandle && `• @${clientInfo.twitterHandle}`}
            </p>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <AnalyticsDashboard clientId={clientId} isAdminView={true} />
      </div>
    </Layout>
  )
}