'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { PlusIcon, PencilIcon, TrashIcon, UserIcon, CalendarDaysIcon, LinkIcon, ClipboardIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Client {
  id: string
  name: string
  email: string
  twitterHandle?: string
  createdAt: string
  userId?: string | null
  calendarShareToken?: string | null
  user?: {
    id: string
    name: string
    email: string
    role: string
  } | null
  _count?: {
    uploads: number
    posts: number
  }
}

interface ClientFormData {
  name: string
  email: string
  twitterHandle: string
  createUserAccount: boolean
  password: string
}

export default function ClientManagement() {
  const { data: session } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    twitterHandle: '',
    createUserAccount: true,
    password: ''
  })
  const [fixingLinks, setFixingLinks] = useState(false)
  const [calendarShareModalOpen, setCalendarShareModalOpen] = useState(false)
  const [calendarShareClient, setCalendarShareClient] = useState<Client | null>(null)
  const [calendarShareUrl, setCalendarShareUrl] = useState<string | null>(null)
  const [generatingShareLink, setGeneratingShareLink] = useState(false)
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const handleFixClientLinks = async () => {
    setFixingLinks(true)
    try {
      const response = await fetch('/api/admin/fix-client-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fix client links')
      }

      const result = await response.json()
      toast.success(result.message)
      
      // Refresh clients list to show updated links
      await fetchClients()
    } catch (error) {
      console.error('Error fixing client links:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fix client links')
    } finally {
      setFixingLinks(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.createUserAccount && !formData.password && !editingClient) {
      toast.error('Password is required when creating user account')
      return
    }
    
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
      const method = editingClient ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save client')
      }

      const savedClient = await response.json()
      
      if (editingClient) {
        setClients(clients.map(c => c.id === editingClient.id ? savedClient : c))
        toast.success('Client updated successfully')
      } else {
        setClients([...clients, savedClient])
        if (formData.createUserAccount) {
          toast.success('Client created with login access successfully')
        } else {
          toast.success('Client created successfully')
        }
      }

      closeModal()
    } catch (error) {
      console.error('Error saving client:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save client')
    }
  }

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This will also delete all their analytics data and posts.')) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete client')
      }

      setClients(clients.filter(c => c.id !== clientId))
      toast.success('Client deleted successfully')
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    }
  }

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client)
      setFormData({
        name: client.name,
        email: client.email,
        twitterHandle: client.twitterHandle || '',
        createUserAccount: false,
        password: ''
      })
    } else {
      setEditingClient(null)
      setFormData({ 
        name: '', 
        email: '', 
        twitterHandle: '',
        createUserAccount: true,
        password: ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingClient(null)
    setFormData({
      name: '',
      email: '',
      twitterHandle: '',
      createUserAccount: true,
      password: ''
    })
  }

  const openCalendarShareModal = async (client: Client) => {
    setCalendarShareClient(client)
    setCalendarShareModalOpen(true)

    if (client.calendarShareToken) {
      const baseUrl = window.location.origin
      setCalendarShareUrl(`${baseUrl}/calendar/share/${client.calendarShareToken}`)
    } else {
      setCalendarShareUrl(null)
    }
  }

  const generateCalendarShareLink = async () => {
    if (!calendarShareClient) return

    setGeneratingShareLink(true)
    try {
      const response = await fetch(`/api/clients/${calendarShareClient.id}/calendar-share`, {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate share link')
      }

      const data = await response.json()
      setCalendarShareUrl(data.shareUrl)

      // Update the client in the list
      setClients(clients.map(c =>
        c.id === calendarShareClient.id
          ? { ...c, calendarShareToken: data.calendarShareToken }
          : c
      ))
      setCalendarShareClient({ ...calendarShareClient, calendarShareToken: data.calendarShareToken })

      toast.success('Calendar share link generated!')
    } catch (error) {
      console.error('Error generating calendar share link:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate share link')
    } finally {
      setGeneratingShareLink(false)
    }
  }

  const revokeCalendarShareLink = async () => {
    if (!calendarShareClient) return

    if (!confirm('Are you sure you want to revoke this calendar share link? Anyone with the link will no longer be able to access it.')) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${calendarShareClient.id}/calendar-share`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to revoke share link')
      }

      setCalendarShareUrl(null)

      // Update the client in the list
      setClients(clients.map(c =>
        c.id === calendarShareClient.id
          ? { ...c, calendarShareToken: null }
          : c
      ))
      setCalendarShareClient({ ...calendarShareClient, calendarShareToken: null })

      toast.success('Calendar share link revoked')
    } catch (error) {
      console.error('Error revoking calendar share link:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to revoke share link')
    }
  }

  const copyToClipboard = async () => {
    if (!calendarShareUrl) return

    try {
      await navigator.clipboard.writeText(calendarShareUrl)
      toast.success('Link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const closeCalendarShareModal = () => {
    setCalendarShareModalOpen(false)
    setCalendarShareClient(null)
    setCalendarShareUrl(null)
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100">Client Management</h2>
        {isAdmin && (
          <div className="flex space-x-3">
            <button
              onClick={handleFixClientLinks}
              disabled={fixingLinks}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2 disabled:opacity-50"
            >
              {fixingLinks ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
              <span>{fixingLinks ? 'Fixing...' : 'Fix Client Links'}</span>
            </button>
            <button
              onClick={() => openModal()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Client</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft dark:shadow-gray-900/20 rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Twitter Handle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Uploads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Login Access
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{client.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {client.twitterHandle ? `@${client.twitterHandle}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {client._count?.uploads || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {client._count?.posts || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.user ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ✗ No Access
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => openCalendarShareModal(client)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Share Calendar"
                      >
                        <CalendarDaysIcon className="h-5 w-5" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openModal(client)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit Client"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Client"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {clients.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No clients</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Get started by creating your first client.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-md shadow-large border border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="client@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400 dark:text-gray-500">@</span>
                  <input
                    type="text"
                    value={formData.twitterHandle}
                    onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                    className="w-full pl-8 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="username"
                  />
                </div>
              </div>

              {!editingClient && (
                <>
                  <div className="flex items-center space-x-3">
                    <input
                      id="createUserAccount"
                      type="checkbox"
                      checked={formData.createUserAccount}
                      onChange={(e) => setFormData({ ...formData, createUserAccount: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="createUserAccount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Create login account for this client
                    </label>
                  </div>

                  {formData.createUserAccount && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required={formData.createUserAccount}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Enter password for client login"
                        minLength={6}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This will allow the client to log in and approve/reject posts
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {editingClient ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar Share Modal */}
      {calendarShareModalOpen && calendarShareClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-lg shadow-large border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <CalendarDaysIcon className="h-6 w-6 text-blue-500" />
                Share Calendar
              </h3>
              <button
                onClick={closeCalendarShareModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Share {calendarShareClient.name}'s content calendar with a public link. Anyone with this link can view the scheduled posts.
            </p>

            {calendarShareUrl ? (
              <div className="space-y-4">
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Share Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={calendarShareUrl}
                      className="flex-1 text-sm bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 p-0"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Copy to clipboard"
                    >
                      <ClipboardIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={revokeCalendarShareLink}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Revoke Link
                  </button>
                  <a
                    href={calendarShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Open Calendar
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  No share link exists yet. Generate one to share this calendar.
                </p>
                <button
                  onClick={generateCalendarShareLink}
                  disabled={generatingShareLink}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {generatingShareLink ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4" />
                      Generate Share Link
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}