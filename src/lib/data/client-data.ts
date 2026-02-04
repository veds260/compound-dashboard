import { prisma } from '@/lib/db'
import { startPerf, perfLog } from '@/lib/perf-logger'
import { getClientStatsFromCache } from '@/lib/stats-manager'

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

// Get stats from pre-computed cache table (instant)
export async function getClientStats(clientId: string): Promise<ClientStats> {
  return getClientStatsFromCache(clientId)
}

// Get client posts (no server-side cache - relies on client-side IndexedDB)
export async function getClientPosts(clientId: string, limit: number = 50): Promise<Post[]> {
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
}

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

// Get client posts with full details for approval system
export async function getClientPostsForApproval(clientId: string, limit: number = 50): Promise<PostWithDetails[]> {
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
}

// Alias for backwards compatibility
export async function getClientStatsUncached(clientId: string): Promise<ClientStats> {
  return getClientStatsFromCache(clientId)
}

// Get recent posts only (for priority loading - last N days)
export async function getRecentClientPosts(clientId: string, recentDays: number = 10, limit: number = 50): Promise<Post[]> {
  const dbStart = startPerf()

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - recentDays)

  const posts = await prisma.post.findMany({
    where: {
      clientId,
      createdAt: { gte: cutoffDate }
    },
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

  perfLog('DB - getRecentClientPosts', dbStart)
  return posts as Post[]
}
