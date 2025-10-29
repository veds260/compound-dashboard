'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { TrashIcon, ExclamationTriangleIcon, ArrowPathIcon, PhotoIcon } from '@heroicons/react/24/outline'

interface PostWithMedia {
  id: string
  content: string
  mediaCount: number
  mediaSize: number
  updatedAt: string
  client: {
    name: string
  }
}

export default function DatabaseManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [migratingDb, setMigratingDb] = useState(false)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [postsWithMedia, setPostsWithMedia] = useState<PostWithMedia[]>([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [mediaStats, setMediaStats] = useState({ totalPosts: 0, totalSize: 0 })
  const [confirmMediaAction, setConfirmMediaAction] = useState<string | null>(null)
  const [confirmMediaText, setConfirmMediaText] = useState('')
  const [deletingMedia, setDeletingMedia] = useState(false)

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

    // Fetch media stats on mount
    fetchMediaStats()
  }, [session, status, router])

  const handleRunMigrations = async () => {
    setMigratingDb(true)
    try {
      const response = await fetch('/api/admin/run-migrations', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Migration failed')
      }

      toast.success(data.message || 'Migrations applied successfully!')
    } catch (error) {
      console.error('Migration error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to run migrations')
    } finally {
      setMigratingDb(false)
    }
  }

  const handleCleanup = async (action: string) => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/cleanup-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Cleanup failed')
      }

      toast.success(data.message)
      setConfirmAction(null)
      setConfirmText('')
    } catch (error) {
      console.error('Cleanup error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to cleanup database')
    } finally {
      setLoading(false)
    }
  }

  const fetchMediaStats = async () => {
    setLoadingMedia(true)
    try {
      const response = await fetch('/api/admin/media-stats')
      if (!response.ok) {
        throw new Error('Failed to fetch media stats')
      }
      const data = await response.json()
      setPostsWithMedia(data.posts)
      setMediaStats({ totalPosts: data.totalPosts, totalSize: data.totalSize })
    } catch (error) {
      console.error('Error fetching media stats:', error)
      toast.error('Failed to load media statistics')
    } finally {
      setLoadingMedia(false)
    }
  }

  const handleDeleteMedia = async (action: string, postId?: string) => {
    if (confirmMediaText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setDeletingMedia(true)
    try {
      const response = await fetch('/api/admin/delete-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, postId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete media')
      }

      toast.success(data.message)
      setConfirmMediaAction(null)
      setConfirmMediaText('')

      // Refresh media stats
      await fetchMediaStats()
    } catch (error) {
      console.error('Delete media error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete media')
    } finally {
      setDeletingMedia(false)
    }
  }

  const actions = [
    {
      id: 'DELETE_ALL_POSTS',
      title: 'Delete All Posts',
      description: 'Remove all posts from the database. Clients and users will remain.',
      color: 'yellow'
    },
    {
      id: 'DELETE_ALL_CLIENTS',
      title: 'Delete All Clients',
      description: 'Remove all clients and their associated data (posts, analytics, etc.).',
      color: 'orange'
    },
    {
      id: 'DELETE_ALL_USERS',
      title: 'Delete All Users',
      description: 'Remove all users except the admin account (compoundops@gmail.com).',
      color: 'orange'
    },
    {
      id: 'FULL_RESET',
      title: 'Full Database Reset',
      description: 'Delete EVERYTHING and start fresh. Only admin account will remain.',
      color: 'red'
    }
  ]

  if (status === 'loading' || !session) {
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
        <div>
          <h1 className="text-2xl font-bold text-white">Database Management</h1>
          <p className="text-gray-400 mt-1">Manage and cleanup your database</p>
        </div>

        {/* Run Migrations */}
        <div className="bg-theme-card rounded-xl border border-theme-border p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Run Database Migrations</h3>
              <p className="text-gray-400 mt-1">
                Apply pending database schema changes. Run this after deploying new code with schema updates.
              </p>
            </div>
            <button
              onClick={handleRunMigrations}
              disabled={migratingDb}
              className="ml-4 px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 bg-blue-900/30 text-blue-300 border-blue-800 hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`h-5 w-5 ${migratingDb ? 'animate-spin' : ''}`} />
              <span>{migratingDb ? 'Running...' : 'Run Migrations'}</span>
            </button>
          </div>
        </div>

        {/* Media Management */}
        <div className="bg-theme-card rounded-xl border border-theme-border p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <PhotoIcon className="h-6 w-6 mr-2 text-purple-400" />
                  Media Management
                </h3>
                <p className="text-gray-400 mt-1">
                  Manage and remove media uploads. Use this if problematic media is causing database issues.
                </p>
              </div>
              <button
                onClick={fetchMediaStats}
                disabled={loadingMedia}
                className="px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 bg-purple-900/30 text-purple-300 border-purple-800 hover:bg-purple-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon className={`h-5 w-5 ${loadingMedia ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
                <p className="text-sm text-gray-400">Posts with Media</p>
                <p className="text-2xl font-bold text-white mt-1">{mediaStats.totalPosts}</p>
              </div>
              <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
                <p className="text-sm text-gray-400">Total Size</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {(mediaStats.totalSize / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>

            {/* Bulk Actions */}
            {mediaStats.totalPosts > 0 && (
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setConfirmMediaAction('DELETE_RECENT_MEDIA')}
                  className="px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 bg-orange-900/30 text-orange-300 border-orange-800 hover:bg-orange-900/50"
                >
                  <TrashIcon className="h-5 w-5" />
                  <span>Remove Recent Media (24h)</span>
                </button>
                <button
                  onClick={() => setConfirmMediaAction('DELETE_ALL_MEDIA')}
                  className="px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 bg-red-900/30 text-red-300 border-red-800 hover:bg-red-900/50"
                >
                  <TrashIcon className="h-5 w-5" />
                  <span>Remove All Media</span>
                </button>
              </div>
            )}

            {/* Posts List */}
            {loadingMedia ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
              </div>
            ) : postsWithMedia.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {postsWithMedia.map((post) => (
                  <div
                    key={post.id}
                    className="bg-theme-bg border border-theme-border rounded-lg p-4 flex items-start justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">{post.client.name}</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(post.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2 truncate">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{post.mediaCount} {post.mediaCount === 1 ? 'image' : 'images'}</span>
                        <span>{(post.mediaSize / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmMediaAction(`DELETE_POST_MEDIA:${post.id}`)}
                      className="ml-4 p-2 rounded-lg border transition-colors bg-red-900/30 text-red-300 border-red-800 hover:bg-red-900/50"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No media uploads found</p>
            )}
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-500">Warning</h3>
              <p className="text-sm text-yellow-200 mt-1">
                These actions are PERMANENT and cannot be undone. Make sure you have backups if needed.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {actions.map((action) => (
            <div
              key={action.id}
              className="bg-theme-card rounded-xl border border-theme-border p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{action.title}</h3>
                  <p className="text-gray-400 mt-1">{action.description}</p>
                </div>
                <button
                  onClick={() => {
                    setConfirmAction(action.id)
                    setConfirmText('')
                  }}
                  className={`ml-4 px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 ${
                    action.color === 'red'
                      ? 'bg-red-900/30 text-red-300 border-red-800 hover:bg-red-900/50'
                      : action.color === 'orange'
                      ? 'bg-orange-900/30 text-orange-300 border-orange-800 hover:bg-orange-900/50'
                      : 'bg-yellow-900/30 text-yellow-300 border-yellow-800 hover:bg-yellow-900/50'
                  }`}
                >
                  <TrashIcon className="h-5 w-5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => {
          setConfirmAction(null)
          setConfirmText('')
        }}>
          <div className="bg-theme-card rounded-xl p-6 w-full max-w-lg shadow-large border border-theme-border" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Confirm Deletion</h3>

            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-300 text-sm">
                This action is PERMANENT and cannot be undone. All data will be lost.
              </p>
            </div>

            <p className="text-gray-300 mb-4">
              Type <span className="font-mono font-semibold text-white">DELETE</span> to confirm:
            </p>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="w-full rounded-md border border-theme-border bg-theme-bg text-gray-200 placeholder-gray-500 shadow-sm focus:border-red-500 focus:ring-red-500 px-3 py-2 mb-6"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setConfirmAction(null)
                  setConfirmText('')
                }}
                className="px-4 py-2 border border-theme-border rounded-md text-gray-300 bg-theme-card hover:bg-theme-bg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCleanup(confirmAction)}
                disabled={confirmText !== 'DELETE' || loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>{loading ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Deletion Confirmation Modal */}
      {confirmMediaAction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => {
          setConfirmMediaAction(null)
          setConfirmMediaText('')
        }}>
          <div className="bg-theme-card rounded-xl p-6 w-full max-w-lg shadow-large border border-theme-border" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Confirm Media Deletion</h3>

            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-300 text-sm">
                {confirmMediaAction === 'DELETE_ALL_MEDIA'
                  ? 'This will remove all media from ALL posts. This action is PERMANENT and cannot be undone.'
                  : confirmMediaAction === 'DELETE_RECENT_MEDIA'
                  ? 'This will remove media from all posts updated in the last 24 hours. This action is PERMANENT and cannot be undone.'
                  : 'This will remove media from this specific post. This action is PERMANENT and cannot be undone.'}
              </p>
            </div>

            <p className="text-gray-300 mb-4">
              Type <span className="font-mono font-semibold text-white">DELETE</span> to confirm:
            </p>

            <input
              type="text"
              value={confirmMediaText}
              onChange={(e) => setConfirmMediaText(e.target.value)}
              placeholder="Type DELETE here"
              className="w-full rounded-md border border-theme-border bg-theme-bg text-gray-200 placeholder-gray-500 shadow-sm focus:border-red-500 focus:ring-red-500 px-3 py-2 mb-6"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setConfirmMediaAction(null)
                  setConfirmMediaText('')
                }}
                className="px-4 py-2 border border-theme-border rounded-md text-gray-300 bg-theme-card hover:bg-theme-bg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const [action, postId] = confirmMediaAction.split(':')
                  handleDeleteMedia(action, postId)
                }}
                disabled={confirmMediaText !== 'DELETE' || deletingMedia}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {deletingMedia && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>{deletingMedia ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
