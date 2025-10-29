'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import PostApprovalSystem from '@/components/PostApprovalSystem'
import PostCalendar from '@/components/PostCalendar'
import ContentDump from '@/components/ContentDump'
import { ListBulletIcon, CalendarIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

type ViewMode = 'list' | 'calendar' | 'content-dump'

interface Post {
  id: string
  content: string
  scheduledDate?: string
  typefullyUrl: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUGGEST_CHANGES' | 'PUBLISHED'
  feedback?: string
  media?: string
  createdAt: string
  publishedDate?: string
  client?: {
    id: string
    name: string
    email: string
    timezone?: string
  }
}

export default function AdminPostsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [clients, setClients] = useState<{id: string, name: string}[]>([])

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

    if (viewMode === 'calendar' || viewMode === 'content-dump') {
      fetchPosts()
    }
  }, [session, status, router, viewMode, selectedClient])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      const data = await response.json()
      setClients(data.map((c: any) => ({ id: c.id, name: c.name })))
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      const url = selectedClient
        ? `/api/posts?clientId=${selectedClient}`
        : '/api/posts'

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load posts')
      }

      setPosts(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load posts')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || !session) {
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
        {/* View Mode Selector */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">Posts Management</h1>
            {(viewMode === 'calendar' || viewMode === 'content-dump') && (
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="rounded-md border-theme-border bg-theme-card text-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2"
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center space-x-2 bg-theme-card rounded-lg p-1 border border-theme-border">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                viewMode === 'list'
                  ? 'bg-theme-accent text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <ListBulletIcon className="h-5 w-5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                viewMode === 'calendar'
                  ? 'bg-theme-accent text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <CalendarIcon className="h-5 w-5" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('content-dump')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                viewMode === 'content-dump'
                  ? 'bg-theme-accent text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5" />
              <span>Content Dump</span>
            </button>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'list' && (
          <PostApprovalSystem
            userRole="AGENCY"
            isAdmin={true}
            onClientChange={(clientId) => setSelectedClient(clientId)}
          />
        )}

        {viewMode === 'calendar' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent"></div>
              </div>
            ) : (
              <PostCalendar
                posts={posts}
                userRole="AGENCY"
                onEditPost={() => {}}
                onPostUpdate={fetchPosts}
              />
            )}
          </div>
        )}

        {viewMode === 'content-dump' && (
          <ContentDump
            clientId={selectedClient}
            userRole="AGENCY"
          />
        )}
      </div>
    </Layout>
  )
}
