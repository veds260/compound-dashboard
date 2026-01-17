'use client'

import { SWRConfig } from 'swr'
import Layout from '@/components/Layout'
import PostApprovalSystem from '@/components/PostApprovalSystem'
import ErrorBoundary from '@/components/ErrorBoundary'

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
