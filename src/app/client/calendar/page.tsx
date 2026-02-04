'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import PostCalendar from '@/components/PostCalendar'
import { Skeleton } from '@/components/Skeleton'
import { usePriorityPosts } from '@/lib/hooks/use-priority-posts'
import toast from 'react-hot-toast'

function CalendarSkeleton() {
  return (
    <div className="bg-theme-card rounded-xl border border-theme-border p-6">
      {/* Month header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default function ClientCalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [clientTimezone, setClientTimezone] = useState<string | undefined>()
  const [timezoneLoaded, setTimezoneLoaded] = useState(false)

  const clientId = session?.user?.clientId

  // Use priority loading hook
  const {
    posts,
    isLoadingRecent,
    isLoadingOlder,
    mutate
  } = usePriorityPosts({
    clientId,
    recentDays: 10,
    enabled: status === 'authenticated' && !!clientId
  })

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

    // Fetch client timezone
    fetchClientTimezone()
  }, [session, status, router])

  const fetchClientTimezone = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${session?.user?.clientId}`)
      if (response.ok) {
        const clientData = await response.json()
        if (clientData?.timezone) {
          setClientTimezone(clientData.timezone)
        }
      }
    } catch (error) {
      console.error('Error fetching client timezone:', error)
    } finally {
      setTimezoneLoaded(true)
    }
  }

  const handlePostUpdate = () => {
    mutate()
  }

  if (status === 'loading' || !session) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-72" />
            </div>
          </div>
          <CalendarSkeleton />
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
              {isLoadingOlder && (
                <span className="ml-2 text-xs text-gray-500">(loading older posts...)</span>
              )}
            </p>
          </div>
        </div>

        {isLoadingRecent ? (
          <CalendarSkeleton />
        ) : (
          <PostCalendar
            posts={posts as any}
            userRole="CLIENT"
            clientTimezone={clientTimezone}
            clientId={clientId}
            onEditPost={() => {}}
            onPostUpdate={handlePostUpdate}
          />
        )}
      </div>
    </Layout>
  )
}
