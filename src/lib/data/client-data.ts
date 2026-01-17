import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import { startPerf, perfLog } from '@/lib/perf-logger'

export interface ClientStats {
  scheduledPosts: number
  pendingApprovals: number
  analyticsData: number
}

export interface Post {
  id: string
  content: string
  scheduledDate: Date | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUGGEST_CHANGES' | 'PUBLISHED'
  typefullyUrl: string
  feedback: string | null
  media: string | null
  createdAt: Date
  client: {
    id: string
    name: string
    email: string
    timezone: string | null
  } | null
}

// Single query to get all stats at once (reduces 3 round trips to 1)
async function fetchClientStats(clientId: string): Promise<ClientStats> {
  const dbStart = startPerf()

  // Use raw query to get all counts in a single round trip
  const result = await prisma.$queryRaw<[{ scheduled: bigint; pending: bigint; approved: bigint }]>`
    SELECT
      COUNT(*) FILTER (WHERE "scheduledDate" >= NOW()) as scheduled,
      COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
      COUNT(*) FILTER (WHERE status = 'APPROVED') as approved
    FROM "Post"
    WHERE "clientId" = ${clientId}
  `

  perfLog('DB - getClientStats (single query)', dbStart)

  return {
    scheduledPosts: Number(result[0].scheduled),
    pendingApprovals: Number(result[0].pending),
    analyticsData: Number(result[0].approved)
  }
}

// Cached function to get client stats
export const getClientStats = unstable_cache(
  async (clientId: string): Promise<ClientStats> => {
    console.log('📊 [CACHE MISS] getClientStats - fetching from DB')
    return fetchClientStats(clientId)
  },
  ['client-stats'],
  {
    revalidate: 30,
    tags: ['client-stats']
  }
)

// Cached function to get client posts
export const getClientPosts = unstable_cache(
  async (clientId: string, limit: number = 50): Promise<Post[]> => {
    console.log('📊 [CACHE MISS] getClientPosts - fetching from DB')
    const dbStart = startPerf()

    const posts = await prisma.post.findMany({
      where: { clientId },
      select: {
        id: true,
        content: true,
        scheduledDate: true,
        typefullyUrl: true,
        status: true,
        feedback: true,
        media: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            timezone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    perfLog('DB - getClientPosts', dbStart)
    return posts as Post[]
  },
  ['client-posts'],
  {
    revalidate: 30,
    tags: ['client-posts']
  }
)

// Extended post interface for approval system
export interface PostWithDetails {
  id: string
  content: string
  tweetText: string | null
  scheduledDate: Date | null
  typefullyUrl: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUGGEST_CHANGES' | 'PUBLISHED'
  feedback: string | null
  media: string | null
  createdAt: Date
  publishedDate: Date | null
  client: {
    id: string
    name: string
    email: string
    timezone: string | null
    profilePicture: string | null
    twitterHandle: string | null
  } | null
}

// Cached function to get client posts with full details for approval system
export const getClientPostsForApproval = unstable_cache(
  async (clientId: string, limit: number = 50): Promise<PostWithDetails[]> => {
    console.log('📊 [CACHE MISS] getClientPostsForApproval - fetching from DB')
    const dbStart = startPerf()

    const posts = await prisma.post.findMany({
      where: { clientId },
      select: {
        id: true,
        content: true,
        tweetText: true,
        scheduledDate: true,
        typefullyUrl: true,
        status: true,
        feedback: true,
        media: true,
        createdAt: true,
        publishedDate: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            timezone: true,
            profilePicture: true,
            twitterHandle: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    perfLog('DB - getClientPostsForApproval', dbStart)
    return posts as PostWithDetails[]
  },
  ['client-posts-approval'],
  {
    revalidate: 30,
    tags: ['client-posts']
  }
)

// Non-cached version for when we need fresh data after mutations
export async function getClientStatsUncached(clientId: string): Promise<ClientStats> {
  return fetchClientStats(clientId)
}
