'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import ExcelOperations from '@/components/ExcelOperations'

interface Client {
  id: string
  name: string
  email: string
}

export default function ExcelPage() {
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

    if (session.user.role !== 'AGENCY') {
      router.push('/client')
      return
    }

    fetchClients()
  }, [session, status, router])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      const data = await response.json()
      setClients(data)
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100">Excel Integration</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400">
            Export data to Excel and import approval updates
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ExcelOperations 
              userRole="AGENCY" 
              clientId={selectedClient}
            />
          </div>

          <div className="space-y-6">
            {/* Client Selection */}
            {clients.length > 0 && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Client Reports</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Select Client for Individual Report
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Choose a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Workflow Instructions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 text-xs font-medium">
                      1
                    </span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Export Data</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">
                      Export posts to Excel to get the current status and structure
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 text-xs font-medium">
                      2
                    </span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Update in Excel</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Modify status and feedback columns as needed
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 text-xs font-medium">
                      3
                    </span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Import Updates</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Upload the modified Excel file to sync changes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Options */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Valid Status Values</h3>
              <div className="space-y-2">
                {['PENDING', 'APPROVED', 'REJECTED', 'SCHEDULED', 'PUBLISHED'].map(status => (
                  <div key={status} className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      status === 'PENDING' ? 'bg-yellow-400' :
                      status === 'APPROVED' ? 'bg-green-400' :
                      status === 'REJECTED' ? 'bg-red-400' :
                      status === 'SCHEDULED' ? 'bg-blue-400' :
                      'bg-purple-400'
                    }`}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}