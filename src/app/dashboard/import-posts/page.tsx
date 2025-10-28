'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import PostsImport from '@/components/PostsImport'

interface Client {
  id: string
  name: string
  email: string
}

export default function ImportPostsPage() {
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
      if (data.length > 0) {
        setSelectedClient(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImportSuccess = () => {
    // Could redirect to posts page or refresh data
    router.push('/dashboard/posts')
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100">Import Posts from Google Sheet</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-400">
            Upload your Google Sheet CSV to automatically create posts for client approval
          </p>
        </div>

        {clients.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No clients found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You need to create at least one client before importing posts.
              </p>
              <button
                onClick={() => router.push('/dashboard/clients')}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Create Client
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                Select Client
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full max-w-md rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
            </div>

            {selectedClient ? (
              <PostsImport 
                clientId={selectedClient} 
                onImportSuccess={handleImportSuccess}
              />
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">Please select a client to import posts</p>
              </div>
            )}
          </div>
        )}

        {/* Workflow Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">How It Works</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                  1
                </span>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Export Google Sheet</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Export your Google Sheet with posts data as a CSV file
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                  2
                </span>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Upload CSV</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select your client and upload the CSV file here
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                  3
                </span>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Automatic Processing</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Posts are automatically created with Typefully links for client approval
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                  4
                </span>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Client Approval</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Client can review and approve/reject posts through their dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}