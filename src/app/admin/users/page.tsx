'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import PremiumCard from '@/components/PremiumCard'
import {
  UserGroupIcon,
  UserIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  PencilIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  clientProfile?: {
    id: string
    name: string
    agencyId: string | null
  }
  clients?: {
    id: string
    name: string
    email: string
  }[]
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [allClients, setAllClients] = useState<{id: string, name: string, agencyId: string}[]>([])
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [reassignModal, setReassignModal] = useState<{clientId: string, clientName: string, currentWriterId: string} | null>(null)

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

    fetchUsers()
    fetchAllClients()
  }, [session, status, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setAllClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const toggleRowExpansion = (userId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedRows(newExpanded)
  }

  const handleReassignClient = async (clientId: string, newWriterId: string) => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/reassign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newWriterId })
      })

      if (response.ok) {
        await fetchUsers()
        await fetchAllClients()
        setReassignModal(null)
      }
    } catch (error) {
      console.error('Error reassigning client:', error)
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <ShieldCheckIcon className="h-5 w-5" />
      case 'AGENCY':
        return <BuildingOfficeIcon className="h-5 w-5" />
      case 'CLIENT':
        return <UserIcon className="h-5 w-5" />
      default:
        return <UserIcon className="h-5 w-5" />
    }
  }

  const getRoleBadge = (role: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    switch (role) {
      case 'ADMIN':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200`
      case 'AGENCY':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200`
      case 'CLIENT':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200`
    }
  }

  const usersByRole = {
    ADMIN: users.filter(u => u.role === 'ADMIN'),
    AGENCY: users.filter(u => u.role === 'AGENCY'),
    CLIENT: users.filter(u => u.role === 'CLIENT')
  }

  // Get unassigned clients
  const unassignedClients = allClients.filter(c => !c.agencyId)

  return (
    <Layout>
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl">
              User Management
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage all users across the platform
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <PremiumCard gradient className="pt-6 px-6 pb-8 animate-slide-up">
            <dt>
              <div className="absolute bg-red-500 rounded-xl p-3 shadow-lg">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Admins</p>
            </dt>
            <dd className="ml-16 pb-2 flex items-baseline">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                {usersByRole.ADMIN.length}
              </p>
            </dd>
          </PremiumCard>

          <PremiumCard gradient className="pt-6 px-6 pb-8 animate-slide-up">
            <dt>
              <div className="absolute bg-blue-500 rounded-xl p-3 shadow-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Writers</p>
            </dt>
            <dd className="ml-16 pb-2 flex items-baseline">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                {usersByRole.AGENCY.length}
              </p>
            </dd>
          </PremiumCard>

          <PremiumCard gradient className="pt-6 px-6 pb-8 animate-slide-up">
            <dt>
              <div className="absolute bg-green-500 rounded-xl p-3 shadow-lg">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Clients</p>
            </dt>
            <dd className="ml-16 pb-2 flex items-baseline">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                {usersByRole.CLIENT.length}
              </p>
            </dd>
          </PremiumCard>
        </div>

        {/* All Users Table */}
        <PremiumCard className="animate-fade-in" gradient>
          <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-gray-100">All Users</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Complete list of platform users</p>
          </div>
          <div className="overflow-hidden">
            {users.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No users found in the system.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Associated With
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <>
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.role === 'AGENCY' && user.clients && user.clients.length > 0 && (
                              <button
                                onClick={() => toggleRowExpansion(user.id)}
                                className="mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                {expandedRows.has(user.id) ? (
                                  <ChevronUpIcon className="h-5 w-5" />
                                ) : (
                                  <ChevronDownIcon className="h-5 w-5" />
                                )}
                              </button>
                            )}
                            <div className="text-gray-400 dark:text-gray-500 mr-3">
                              {getRoleIcon(user.role)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getRoleBadge(user.role)}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {user.role === 'CLIENT' && user.clientProfile
                              ? `Client: ${user.clientProfile.name}`
                              : user.role === 'AGENCY' && user.clients
                              ? `${user.clients.length} client${user.clients.length !== 1 ? 's' : ''}`
                              : user.role === 'ADMIN'
                              ? 'System Administrator'
                              : 'N/A'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {user.role === 'CLIENT' && user.clientProfile && (
                            <button
                              onClick={() => {
                                setReassignModal({
                                  clientId: user.clientProfile!.id,
                                  clientName: user.clientProfile!.name,
                                  currentWriterId: user.clientProfile!.agencyId || ''
                                })
                              }}
                              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              <PencilIcon className="h-4 w-4" />
                              <span>{user.clientProfile.agencyId ? 'Reassign' : 'Assign'}</span>
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Row - Show Writer's Clients */}
                      {expandedRows.has(user.id) && user.role === 'AGENCY' && user.clients && user.clients.length > 0 && (
                        <tr key={`${user.id}-expanded`} className="bg-gray-50 dark:bg-gray-900/50">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="ml-12">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Managing {user.clients.length} Client{user.clients.length !== 1 ? 's' : ''}
                              </h4>
                              <div className="space-y-2">
                                {user.clients.map((client) => (
                                  <div
                                    key={client.id}
                                    className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <UserIcon className="h-5 w-5 text-gray-400" />
                                      <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                          {client.name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {client.email}
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => setReassignModal({
                                        clientId: client.id,
                                        clientName: client.name,
                                        currentWriterId: user.id
                                      })}
                                      className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                      <span>Reassign</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </PremiumCard>

        {/* Unassigned Clients */}
        {unassignedClients.length > 0 && (
          <PremiumCard className="animate-fade-in" gradient>
            <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-gray-100">Unassigned Clients</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Clients without an assigned writer</p>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {unassignedClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {client.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          No writer assigned
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setReassignModal({
                        clientId: client.id,
                        clientName: client.name,
                        currentWriterId: ''
                      })}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span>Assign Writer</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </PremiumCard>
        )}
      </div>

      {/* Reassign Client Modal */}
      {reassignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-md shadow-large border border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {reassignModal.currentWriterId ? 'Reassign Client' : 'Assign Writer'}
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {reassignModal.currentWriterId ? 'Reassigning' : 'Assigning'} client: <span className="font-semibold text-gray-900 dark:text-gray-100">{reassignModal.clientName}</span>
              </p>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select {reassignModal.currentWriterId ? 'New' : ''} Writer
              </label>
              <select
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                onChange={(e) => {
                  if (e.target.value) {
                    handleReassignClient(reassignModal.clientId, e.target.value)
                  }
                }}
                defaultValue=""
              >
                <option value="">Choose a writer...</option>
                {users
                  .filter(u => u.role === 'AGENCY' && (reassignModal.currentWriterId ? u.id !== reassignModal.currentWriterId : true))
                  .map(writer => (
                    <option key={writer.id} value={writer.id}>
                      {writer.name} ({writer.clients?.length || 0} clients)
                    </option>
                  ))
                }
              </select>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setReassignModal(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}