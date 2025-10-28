'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { 
  UserGroupIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface WriterDetails {
  id: string
  name: string
  email: string
  createdAt: string
  clients: {
    id: string
    name: string
    email: string
    twitterHandle: string
    posts: {
      id: string
      content: string
      status: string
      createdAt: string
      scheduledDate: string
    }[]
    analytics: {
      id: string
      date: string
      impressions: number
      engagements: number
    }[]
  }[]
}

export default function WriterDetailsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const writerId = params.id as string
  const [writer, setWriter] = useState<WriterDetails | null>(null)
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

    fetchWriterDetails()
  }, [session, status, router, writerId])

  const fetchWriterDetails = async () => {
    try {
      const response = await fetch(`/api/admin/writers/${writerId}`)
      const data = await response.json()
      setWriter(data)
    } catch (error) {
      console.error('Error fetching writer details:', error)
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

  if (!writer) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Writer not found.</p>
        </div>
      </Layout>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'REJECTED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full"
    switch (status) {
      case 'APPROVED':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to Admin Dashboard
          </button>
        </div>

        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl">
              {writer.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {writer.email} • Joined {new Date(writer.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white dark:bg-gray-800 pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow dark:shadow-gray-700/20 rounded-lg overflow-hidden">
            <dt>
              <div className="absolute bg-blue-500 rounded-md p-3">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Clients</p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{writer.clients.length}</p>
            </dd>
          </div>

          <div className="bg-white dark:bg-gray-800 pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow dark:shadow-gray-700/20 rounded-lg overflow-hidden">
            <dt>
              <div className="absolute bg-green-500 rounded-md p-3">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Posts</p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {writer.clients.reduce((acc, client) => acc + client.posts.length, 0)}
              </p>
            </dd>
          </div>

          <div className="bg-white dark:bg-gray-800 pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow dark:shadow-gray-700/20 rounded-lg overflow-hidden">
            <dt>
              <div className="absolute bg-purple-500 rounded-md p-3">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Analytics Records</p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {writer.clients.reduce((acc, client) => acc + client.analytics.length, 0)}
              </p>
            </dd>
          </div>
        </div>

        {/* Clients and Posts */}
        <div className="space-y-6">
          {writer.clients.map((client) => (
            <div key={client.id} className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700/20 rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">{client.name}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {client.email} {client.twitterHandle && `• @${client.twitterHandle}`}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {client.posts.length} posts • {client.analytics.length} analytics records
                  </div>
                </div>
              </div>

              {client.posts.length > 0 ? (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Post Content
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Scheduled
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {client.posts.map((post) => (
                        <tr key={post.id}>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                              {post.content}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(post.status)}
                              <span className={`ml-2 ${getStatusBadge(post.status)}`}>
                                {post.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {post.scheduledDate ? new Date(post.scheduledDate).toLocaleDateString() : 'Not scheduled'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No posts found for this client.</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {writer.clients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">This writer has no clients assigned yet.</p>
          </div>
        )}
      </div>
    </Layout>
  )
}