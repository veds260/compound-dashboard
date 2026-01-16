import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'

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

// Cached function to get client stats
export const getClientStats = unstable_cache(
  async (clientId: string): Promise<ClientStats> => {
    const now = new Date()

    const [scheduledPosts, pendingApprovals, approvedPosts] = await Promise.all([
      prisma.post.count({
        where: {
          clientId,
          scheduledDate: { gte: now }
        }
      }),
      prisma.post.count({
        where: {
          clientId,
          status: 'PENDING'
        }
      }),
      prisma.post.count({
        where: {
          clientId,
          status: 'APPROVED'
        }
      })
    ])

    return {
      scheduledPosts,
      pendingApprovals,
      analyticsData: approvedPosts
    }
  },
  ['client-stats'],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: ['client-stats']
  }
)

// Cached function to get client posts
export const getClientPosts = unstable_cache(
  async (clientId: string, limit: number = 50): Promise<Post[]> => {
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

    return posts as Post[]
  },
  ['client-posts'],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: ['client-posts']
  }
)

// Non-cached version for when we need fresh data after mutations
export async function getClientStatsUncached(clientId: string): Promise<ClientStats> {
  const now = new Date()

  const [scheduledPosts, pendingApprovals, approvedPosts] = await Promise.all([
    prisma.post.count({
      where: {
        clientId,
        scheduledDate: { gte: now }
      }
    }),
    prisma.post.count({
      where: {
        clientId,
        status: 'PENDING'
      }
    }),
    prisma.post.count({
      where: {
        clientId,
        status: 'APPROVED'
      }
    })
  ])

  return {
    scheduledPosts,
    pendingApprovals,
    analyticsData: approvedPosts
  }
}
