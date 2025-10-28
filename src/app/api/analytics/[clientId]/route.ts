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

    // Determine date range
    const days = range === '30d' ? 30 : range === '90d' ? 90 : 7
    const startDate = startOfDay(subDays(new Date(), days))

    // Check access permissions
    let hasAccess = false
    
    if (session.user.role === 'AGENCY') {
      // Agency can access their clients' data
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          agencyId: session.user.id
        }
      })
      hasAccess = !!client
    } else if (session.user.role === 'CLIENT') {
      // Client can only access their own data
      hasAccess = session.user.clientId === clientId
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Fetch Typefully analytics data (TweetAnalytics table)
    const tweetAnalytics = await prisma.tweetAnalytics.findMany({
      where: {
        clientId,
        createdAt: {
          gte: startDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Fetch follower analytics data
    const followerAnalytics = await prisma.followerAnalytics.findMany({
      where: {
        clientId,
        endDate: {
          gte: startDate
        }
      },
      orderBy: {
        endDate: 'asc'
      }
    })

    // Group by date and aggregate data
    const groupedData = tweetAnalytics.reduce((acc, record) => {
      const dateKey = format(record.createdAt, 'yyyy-MM-dd')

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          impressions: 0,
          engagements: 0,
          retweets: 0,
          replies: 0,
          likes: 0,
          profileClicks: 0,
          urlClicks: 0,
          hashtagClicks: 0,
          detailExpands: 0,
          permalinkClicks: 0,
          follows: 0,
          mediaViews: 0,
          mediaEngagements: 0,
          engagementRate: 0,
          clickThroughRate: 0,
          recordCount: 0
        }
      }

      acc[dateKey].impressions += record.impressionCount
      acc[dateKey].engagements += record.totalEngagements
      acc[dateKey].retweets += record.retweetCount
      acc[dateKey].replies += record.replyCount
      acc[dateKey].likes += record.likeCount
      acc[dateKey].profileClicks += record.userProfileClicks
      acc[dateKey].urlClicks += record.urlLinkClicks
      acc[dateKey].hashtagClicks += 0
      acc[dateKey].detailExpands += 0
      acc[dateKey].permalinkClicks += 0
      acc[dateKey].mediaViews += 0
      acc[dateKey].mediaEngagements += 0
      acc[dateKey].engagementRate += record.engagementRate
      acc[dateKey].clickThroughRate += 0
      acc[dateKey].recordCount += 1

      return acc
    }, {} as Record<string, any>)

    // Add follower data to grouped data
    followerAnalytics.forEach(record => {
      const dateKey = format(record.endDate, 'yyyy-MM-dd')

      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          impressions: 0,
          engagements: 0,
          retweets: 0,
          replies: 0,
          likes: 0,
          profileClicks: 0,
          urlClicks: 0,
          hashtagClicks: 0,
          detailExpands: 0,
          permalinkClicks: 0,
          follows: 0,
          mediaViews: 0,
          mediaEngagements: 0,
          engagementRate: 0,
          clickThroughRate: 0,
          recordCount: 0
        }
      }

      groupedData[dateKey].follows += record.followersGained
    })

    // Calculate averages and format final data
    const formattedData = Object.values(groupedData).map((day: any) => ({
      ...day,
      engagementRate: day.recordCount > 0 ? day.engagementRate / day.recordCount : 0,
      clickThroughRate: 0
    }))

    return NextResponse.json(formattedData)

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}