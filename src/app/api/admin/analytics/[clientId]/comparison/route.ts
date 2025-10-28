import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { subDays, startOfDay } from 'date-fns'

export async function GET(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const range = url.searchParams.get('range') || '7d'
    
    let days = 7
    switch (range) {
      case '30d':
        days = 30
        break
      case '90d':
        days = 90
        break
      default:
        days = 7
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: params.clientId }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const currentEndDate = startOfDay(new Date())
    const currentStartDate = startOfDay(subDays(currentEndDate, days))

    const previousEndDate = startOfDay(subDays(currentStartDate, 1))
    const previousStartDate = startOfDay(subDays(previousEndDate, days))

    // Fetch current period tweet analytics
    const currentTweets = await prisma.tweetAnalytics.findMany({
      where: {
        clientId: params.clientId,
        createdAt: {
          gte: currentStartDate,
          lte: currentEndDate
        }
      }
    })

    // Fetch current period follower analytics
    const currentFollowers = await prisma.followerAnalytics.findMany({
      where: {
        clientId: params.clientId,
        endDate: {
          gte: currentStartDate,
          lte: currentEndDate
        }
      }
    })

    // Fetch previous period tweet analytics
    const previousTweets = await prisma.tweetAnalytics.findMany({
      where: {
        clientId: params.clientId,
        createdAt: {
          gte: previousStartDate,
          lte: previousEndDate
        }
      }
    })

    // Fetch previous period follower analytics
    const previousFollowers = await prisma.followerAnalytics.findMany({
      where: {
        clientId: params.clientId,
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
      }
    }

    return NextResponse.json(comparisonData)
  } catch (error) {
    console.error('Admin client analytics comparison error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}