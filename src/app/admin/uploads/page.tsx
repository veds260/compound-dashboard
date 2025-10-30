'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { ClockIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

interface Upload {
  id: string
  filename: string
  originalName: string
  uploadDate: string
  postsCount: number
  client: {
    id: string
    name: string
  }
  uploadedBy: {
    id: string
    name: string
    email: string
  }
  _count: {
    posts: number
  }
}

export default function UploadsManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [undoingId, setUndoingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/login')
      return
    }

    fetchUploads()
  }, [session, status, router])

  const fetchUploads = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    }

    try {
      // Add timestamp to prevent caching
      const response = await fetch(`/api/uploads?t=${Date.now()}`, {
        cache: 'no-store'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch uploads')
      }

      setUploads(data)

      if (isRefresh) {
        toast.success('Upload history refreshed')
      }
    } catch (error) {
      console.error('Error fetching uploads:', error)
      toast.error('Failed to load upload history')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleUndoUpload = async (upload: Upload) => {
    const confirmMessage = `Are you sure you want to undo this upload?\n\nClient: ${upload.client.name}\nUploaded: ${format(new Date(upload.uploadDate), 'MMM d, yyyy h:mm a')}\nPosts: ${upload._count.posts}\n\nThis will revert to the previous upload state for this client. Posts that were updated will be restored, and new posts will be removed.`

    if (!confirm(confirmMessage)) {
      return
    }

    setUndoingId(upload.id)

    try {
      const response = await fetch(`/api/uploads/${upload.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to undo upload')
      }

      toast.success(data.message)
      // Refresh the entire list to show updated state (including restored previous upload)
      await fetchUploads()
    } catch (error) {
      console.error('Error undoing upload:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to undo upload')
    } finally {
      setUndoingId(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Upload History</h1>
            <p className="mt-1 text-sm text-gray-400">
              View and manage CSV uploads. Undo uploads to revert changes.
            </p>
          </div>
          <button
            onClick={() => fetchUploads(true)}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 bg-theme-card border border-theme-border text-gray-300 rounded-lg hover:bg-theme-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Uploads Table */}
        <div className="bg-theme-card rounded-xl border border-theme-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-theme-border">
              <thead className="bg-theme-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Posts
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {uploads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-white">No uploads</h3>
                      <p className="mt-1 text-sm text-gray-400">
                        No CSV uploads found in the system.
                      </p>
                    </td>
                  </tr>
                ) : (
                  uploads.map((upload) => (
                    <tr key={upload.id} className="hover:bg-theme-bg transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{upload.client.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{upload.uploadedBy.name}</div>
                        <div className="text-xs text-gray-500">{upload.uploadedBy.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {format(new Date(upload.uploadDate), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(upload.uploadDate), 'h:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-700">
                          {upload._count.posts} posts
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleUndoUpload(upload)}
                          disabled={undoingId === upload.id}
                          className="inline-flex items-center text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <TrashIcon className="w-4 h-4 mr-1" />
                          {undoingId === upload.id ? 'Undoing...' : 'Undo Upload'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
