'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import PostCalendar from '@/components/PostCalendar'
import toast from 'react-hot-toast'

interface Post {
  id: string
  content: string
  scheduledDate?: string
  typefullyUrl: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUGGEST_CHANGES' | 'PUBLISHED'
  feedback?: string
  media?: string
  createdAt: string
  client: {
    id: string
    name: string
    email: string
  }
}

export default function ClientCalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [clientTimezone, setClientTimezone] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'CLIENT') {
      router.push('/login')
      return
    }

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      // Fetch posts and client data in parallel
      const [postsResponse, clientResponse] = await Promise.all([
        fetch(`/api/posts?clientId=${session?.user?.clientId}`),
        fetch(`/api/admin/clients/${session?.user?.clientId}`)
      ])

      const postsData = await postsResponse.json()
      const clientData = await clientResponse.json()

      if (!postsResponse.ok) {
        throw new Error(postsData.error || 'Failed to load posts')
      }

      // Handle both new paginated format { posts, pagination } and old array format
      setPosts(postsData.posts || (Array.isArray(postsData) ? postsData : []))
      if (clientData && clientData.timezone) {
        setClientTimezone(clientData.timezone)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load data')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/posts?clientId=${session?.user?.clientId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load posts')
      }

      // Handle both new paginated format { posts, pagination } and old array format
      setPosts(data.posts || (Array.isArray(data) ? data : []))
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load posts')
      setPosts([])
    }
  }

  if (status === 'loading' || !session || loading) {
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
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-white sm:text-3xl">
              Calendar View
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              View your scheduled posts in calendar format
            </p>
          </div>
        </div>

        <PostCalendar
          posts={posts}
          userRole="CLIENT"
          clientTimezone={clientTimezone}
          clientId={session?.user?.clientId}
          onEditPost={() => {}}
          onPostUpdate={fetchPosts}
        />
      </div>
    </Layout>
  )
}
