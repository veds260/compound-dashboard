import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { subDays, startOfDay, format } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = params
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'

    // Determine date ranges for current and previous periods
    const days = range === '30d' ? 30 : range === '90d' ? 90 : 7
    const currentEndDate = startOfDay(new Date())
    const currentStartDate = startOfDay(subDays(currentEndDate, days))
    
    const previousEndDate = startOfDay(subDays(currentStartDate, 1))
    const previousStartDate = startOfDay(subDays(previousEndDate, days))

    // Check access permissions
    let hasAccess = false
    
    if (session.user.role === 'AGENCY') {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          agencyId: session.user.id
        }
      })
      hasAccess = !!client
    } else if (session.user.role === 'CLIENT') {
      hasAccess = session.user.clientId === clientId
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Fetch current period tweet analytics
    const currentTweets = await prisma.tweetAnalytics.findMany({
      where: {
        clientId,
        createdAt: {
          gte: currentStartDate,
          lte: currentEndDate
        }
      }
    })

    // Fetch current period follower analytics
    const currentFollowers = await prisma.followerAnalytics.findMany({
      where: {
        clientId,
        endDate: {
          gte: currentStartDate,
          lte: currentEndDate
        }
      }
    })

    // Fetch previous period tweet analytics
    const previousTweets = await prisma.tweetAnalytics.findMany({
      where: {
        clientId,
        createdAt: {
          gte: previousStartDate,
          lte: previousEndDate
        }
      }
    })

    // Fetch previous period follower analytics
    const previousFollowers = await prisma.followerAnalytics.findMany({
      where: {
        clientId,
        endDate: {
          gte: previousStartDate,
          lte: previousEndDate
        }
      }
    })

    // Calculate totals for current period
    const currentTotals = {
      impressions: currentTweets.reduce((sum, t) => sum + t.impressionCount, 0),
      engagements: currentTweets.reduce((sum, t) => sum + t.totalEngagements, 0),
      follows: currentFollowers.reduce((sum, f) => sum + f.followersGained, 0),
      recordCount: currentTweets.length
    }

    // Calculate totals for previous period
    const previousTotals = {
      impressions: previousTweets.reduce((sum, t) => sum + t.impressionCount, 0),
      engagements: previousTweets.reduce((sum, t) => sum + t.totalEngagements, 0),
      follows: previousFollowers.reduce((sum, f) => sum + f.followersGained, 0),
      recordCount: previousTweets.length
    }

    // Calculate engagement rates
    const currentEngagementRate = currentTotals.impressions > 0 
      ? (currentTotals.engagements / currentTotals.impressions) * 100
      : 0

    const previousEngagementRate = previousTotals.impressions > 0 
      ? (previousTotals.engagements / previousTotals.impressions) * 100
      : 0

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const comparisonData = {
      current: {
        impressions: currentTotals.impressions,
        engagements: currentTotals.engagements,
        engagementRate: currentEngagementRate,
        follows: currentTotals.follows
      },
      previous: {
        impressions: previousTotals.impressions,
        engagements: previousTotals.engagements,
        engagementRate: previousEngagementRate,
        follows: previousTotals.follows
      },
      growth: {
        impressions: calculateGrowth(currentTotals.impressions, previousTotals.impressions),
        engagements: calculateGrowth(currentTotals.engagements, previousTotals.engagements),
        engagementRate: calculateGrowth(currentEngagementRate, previousEngagementRate),
        follows: calculateGrowth(currentTotals.follows, previousTotals.follows)
      },
      dateRanges: {
        current: {
          start: format(currentStartDate, 'yyyy-MM-dd'),
          end: format(currentEndDate, 'yyyy-MM-dd')
        },
        previous: {
          start: format(previousStartDate, 'yyyy-MM-dd'),
          end: format(previousEndDate, 'yyyy-MM-dd')
        }
      }
    }

    return NextResponse.json(comparisonData)

  } catch (error) {
    console.error('Analytics comparison API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comparison data' },
      { status: 500 }
    )
  }
}