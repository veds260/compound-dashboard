'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import PremiumCard from '@/components/PremiumCard'
import toast from 'react-hot-toast'
import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Writer {
  id: string
  name: string
  email: string
}

interface ClientWithWriter {
  id: string
  name: string
  email: string
  twitterHandle: string | null
  agencyId: string | null
  active: boolean
  createdAt: string
  agency: {
    id: string
    name: string
    email: string
  } | null
  _count: {
    posts: number
    analytics: number
    uploads: number
  }
}

export default function AdminClientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<ClientWithWriter[]>([])
  const [writers, setWriters] = useState<Writer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<ClientWithWriter | null>(null)
  const [selectedWriterId, setSelectedWriterId] = useState<string>('')

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

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      const [clientsRes, writersRes] = await Promise.all([
        fetch('/api/admin/clients'),
        fetch('/api/admin/available-writers')
      ])

      const clientsData = await clientsRes.json()
      const writersData = await writersRes.json()

      setClients(clientsData)
      setWriters(writersData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignWriter = (client: ClientWithWriter) => {
    setSelectedClient(client)
    setSelectedWriterId(client.agency?.id || '')
  }

  const assignedClients = clients.filter(c => c.agencyId)
  const unassignedClients = clients.filter(c => !c.agencyId)

  const handleSaveAssignment = async () => {
    if (!selectedClient || !selectedWriterId) return

    try {
      const response = await fetch('/api/admin/assign-writer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          writerId: selectedWriterId
        })
      })

      if (response.ok) {
        toast.success('Writer assigned successfully')
        setSelectedClient(null)
        setSelectedWriterId('')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to assign writer')
      }
    } catch (error) {
      console.error('Assign writer error:', error)
      toast.error('Failed to assign writer')
    }
  }

  const handleToggleActive = async (clientId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive })
      })

      if (response.ok) {
        toast.success(`Client ${!currentActive ? 'activated' : 'deactivated'}`)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update client status')
      }
    } catch (error) {
      console.error('Toggle client active error:', error)
      toast.error('Failed to update client status')
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
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl">
              Client & Writer Management
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Assign and reassign writers to clients
            </p>
          </div>
        </div>

        {/* Unassigned Clients */}
        {unassignedClients.length > 0 && (
          <PremiumCard className="animate-fade-in" gradient>
            <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg leading-6 font-semibold text-orange-600 dark:text-orange-400">Unassigned Clients</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {unassignedClients.length} client{unassignedClients.length !== 1 ? 's' : ''} need{unassignedClients.length === 1 ? 's' : ''} a writer
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Twitter Handle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Posts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Uploads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {unassignedClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 bg-orange-50 dark:bg-orange-900/10">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{client.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{client.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {client.twitterHandle || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{client._count.posts}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{client._count.uploads}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(client.id, client.active)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            client.active ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              client.active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`ml-2 text-xs ${client.active ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {client.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleAssignWriter(client)}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 flex items-center font-semibold hover:scale-105 transition-all duration-200"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Assign Writer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PremiumCard>
        )}

        {/* Assigned Clients Table */}
        <PremiumCard className="animate-fade-in" gradient>
          <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-gray-100">Assigned Clients</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Total: {assignedClients.length} client{assignedClients.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="overflow-x-auto">
            {assignedClients.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No assigned clients yet.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Twitter Handle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Assigned Writer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Posts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Uploads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {assignedClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{client.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{client.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {client.twitterHandle || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {client.agency ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{client.agency.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{client.agency.email}</div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">No writer assigned</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{client._count.posts}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{client._count.uploads}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(client.id, client.active)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            client.active ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              client.active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`ml-2 text-xs ${client.active ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {client.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleAssignWriter(client)}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 flex items-center hover:scale-105 transition-all duration-200"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Reassign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </PremiumCard>
      </div>

      {/* Assignment Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-large border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {selectedClient.agency ? 'Reassign' : 'Assign'} Writer to {selectedClient.name}
              </h3>
              <button
                onClick={() => {
                  setSelectedClient(null)
                  setSelectedWriterId('')
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Writer
                </label>
                <select
                  value={selectedWriterId}
                  onChange={(e) => setSelectedWriterId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select a writer...</option>
                  {writers.map((writer) => (
                    <option key={writer.id} value={writer.id}>
                      {writer.name} ({writer.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setSelectedClient(null)
                    setSelectedWriterId('')
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssignment}
                  disabled={!selectedWriterId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
