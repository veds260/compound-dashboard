'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

interface Client {
  id: string
  name: string
  email: string
  agency: {
    id: string
    name: string
    email: string
  } | null
}

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState('')
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

    fetchClients()
  }, [session, status, router])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients')
      const data = await response.json()
      setClients(data)
      if (data.length > 0) {
        setSelectedClient(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || !session || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">System Analytics</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Platform-wide performance metrics and insights
            </p>
          </div>

          {clients.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Client
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} (Writer: {client.agency?.name || 'Unassigned'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {clients.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No clients found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No clients exist in the system yet.
              </p>
            </div>
          </div>
        ) : selectedClient ? (
          <AnalyticsDashboard clientId={selectedClient} isAdminView={true} />
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">Please select a client to view analytics</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
