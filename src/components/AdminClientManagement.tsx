'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  UserGroupIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface Client {
  id: string
  name: string
  email: string
  twitterHandle?: string
  createdAt: string
  _count: {
    posts: number
    uploads: number
    analytics: number
  }
}

interface Agency {
  id: string
  name: string
  email: string
  createdAt: string
  clients: Client[]
}

export default function AdminClientManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [currentAgency, setCurrentAgency] = useState<Agency | null>(null)
  const [newAgencyId, setNewAgencyId] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [reassigning, setReassigning] = useState(false)

  useEffect(() => {
    fetchAgencies()
  }, [])

  const fetchAgencies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/agencies')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch agencies')
      }

      const data = await response.json()
      setAgencies(data)
    } catch (error) {
      console.error('Error fetching agencies:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load agencies')
    } finally {
      setLoading(false)
    }
  }

  const handleReassignClick = (client: Client, agency: Agency) => {
    setSelectedClient(client)
    setCurrentAgency(agency)
    setNewAgencyId('')
    setIsModalOpen(true)
  }

  const handleReassign = async () => {
    if (!selectedClient || !newAgencyId) {
      toast.error('Please select a new agency')
      return
    }

    if (newAgencyId === currentAgency?.id) {
      toast.error('Client is already assigned to this agency')
      return
    }

    try {
      setReassigning(true)

      const response = await fetch('/api/admin/reassign-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: selectedClient.id,
          newAgencyId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reassign client')
      }

      toast.success(result.message || 'Client reassigned successfully')
      setIsModalOpen(false)
      setSelectedClient(null)
      setCurrentAgency(null)
      setNewAgencyId('')

      // Refresh agencies list
      await fetchAgencies()
    } catch (error) {
      console.error('Error reassigning client:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reassign client')
    } finally {
      setReassigning(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedClient(null)
    setCurrentAgency(null)
    setNewAgencyId('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100">
          Client Assignment Management
        </h2>
        <button
          onClick={fetchAgencies}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="space-y-6">
        {agencies.map((agency) => (
          <div
            key={agency.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            {/* Agency Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="h-6 w-6 text-primary-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {agency.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">{agency.email}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                {agency.clients.length} client{agency.clients.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Clients List */}
            {agency.clients.length > 0 ? (
              <div className="space-y-2">
                {agency.clients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {client.name}
                        </h4>
                        {client.twitterHandle && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            @{client.twitterHandle}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{client.email}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{client._count.posts} posts</span>
                        <span>{client._count.uploads} uploads</span>
                        <span>{client._count.analytics} analytics</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReassignClick(client, agency)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      Reassign
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No clients assigned to this writer
              </p>
            )}
          </div>
        ))}

        {agencies.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No agencies found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create agency users to manage clients
            </p>
          </div>
        )}
      </div>

      {/* Reassignment Modal */}
      {isModalOpen && selectedClient && currentAgency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-large border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Reassign Client
              </h3>
              <button
                onClick={closeModal}
                disabled={reassigning}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedClient.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedClient.email}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Writer
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {currentAgency.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentAgency.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Writer *
                </label>
                <select
                  value={newAgencyId}
                  onChange={(e) => setNewAgencyId(e.target.value)}
                  disabled={reassigning}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50"
                >
                  <option value="">Select a writer</option>
                  {agencies
                    .filter((agency) => agency.id !== currentAgency.id)
                    .map((agency) => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name} ({agency.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> Reassigning will transfer all posts, analytics, and uploads
                  to the new writer. This action cannot be undone automatically.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={closeModal}
                  disabled={reassigning}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReassign}
                  disabled={reassigning || !newAgencyId}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reassigning ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Reassigning...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Confirm Reassignment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
