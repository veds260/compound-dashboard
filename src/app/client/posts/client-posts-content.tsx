'use client'

import { useEffect } from 'react'
import { SWRConfig } from 'swr'
import Layout from '@/components/Layout'
import PostApprovalSystem from '@/components/PostApprovalSystem'
import ErrorBoundary from '@/components/ErrorBoundary'

// Track when the module was loaded (before hydration)
const moduleLoadTime = Date.now()

interface SerializedPost {
  id: string
  content: string
  tweetText: string | null
  scheduledDate: string | null
  typefullyUrl: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUGGEST_CHANGES' | 'PUBLISHED'
  feedback: string | null
  media: string | null
  createdAt: string
  publishedDate: string | null
  client: {
    id: string
    name: string
    email: string
    timezone: string | null
    profilePicture: string | null
    twitterHandle: string | null
  } | null
}

interface ClientPostsContentProps {
  initialPosts: SerializedPost[]
  clientId: string
  initialStatusFilter?: string
}

export default function ClientPostsContent({
  initialPosts,
  clientId,
  initialStatusFilter
}: ClientPostsContentProps) {
  // Log client-side hydration time
  useEffect(() => {
    const hydrationTime = Date.now() - moduleLoadTime
    const emoji = hydrationTime < 100 ? '🟢' : hydrationTime < 500 ? '🟡' : '🔴'
    console.log(`${emoji} [CLIENT-PERF] /client/posts - Component hydrated: ${hydrationTime}ms since module load`)
    console.log(`${emoji} [CLIENT-PERF] /client/posts - Initial posts count: ${initialPosts.length}`)
  }, [initialPosts.length])

  // Build the SWR cache key that matches what PostApprovalSystem uses
  const postsUrl = `/api/posts?clientId=${clientId}`

  return (
    <SWRConfig
      value={{
        fallback: {
          // Pre-populate SWR cache with server-fetched data
          [postsUrl]: initialPosts
        }
      }}
    >
      <ErrorBoundary>
        <Layout>
          <PostApprovalSystem
            userRole="CLIENT"
            clientId={clientId}
            initialStatusFilter={initialStatusFilter}
          />
        </Layout>
      </ErrorBoundary>
    </SWRConfig>
  )
}
