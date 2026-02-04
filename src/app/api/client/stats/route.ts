import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClientStatsFromCache } from '@/lib/stats-manager'
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

    const dbStart = startPerf()
    const stats = await getClientStatsFromCache(session.user.clientId)
    perfLog('API /api/client/stats - getClientStatsFromCache', dbStart)

    perfLog('API /api/client/stats - TOTAL', apiStart)

    return NextResponse.json({
      scheduledPosts: stats.scheduledPosts,
      pendingApprovals: stats.pendingApprovals,
      analyticsData: stats.analyticsData
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
