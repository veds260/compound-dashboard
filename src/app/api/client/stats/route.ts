import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { startPerf, perfLog } from '@/lib/perf-logger'

export async function GET() {
  const apiStart = startPerf()
  try {
    const sessionStart = startPerf()
    const session = await getServerSession(authOptions)
    perfLog('API /api/client/stats - getServerSession', sessionStart)

    if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    const dbStart = startPerf()
    const [scheduledPosts, pendingApprovals, approvedPosts] = await Promise.all([
      prisma.post.count({
        where: {
          clientId: session.user.clientId,
          scheduledDate: { gte: now }
        }
      }),
      prisma.post.count({
        where: {
          clientId: session.user.clientId,
          status: 'PENDING'
        }
      }),
      prisma.post.count({
        where: {
          clientId: session.user.clientId,
          status: 'APPROVED'
        }
      })
    ])
    perfLog('API /api/client/stats - DB queries', dbStart)

    perfLog('API /api/client/stats - TOTAL', apiStart)

    return NextResponse.json({
      scheduledPosts,
      pendingApprovals,
      analyticsData: approvedPosts
    }, {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
      }
    })
  } catch (error) {
    console.error('Error fetching client stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client stats' },
      { status: 500 }
    )
  }
}
