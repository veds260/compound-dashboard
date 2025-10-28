import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { subDays, format, startOfDay } from 'date-fns'

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

    const startDate = startOfDay(subDays(new Date(), days))

    // Fetch Typefully analytics data (TweetAnalytics table)
    const tweetAnalytics = await prisma.tweetAnalytics.findMany({
      where: {
        clientId: params.clientId,
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
        clientId: params.clientId,
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
      acc[dateKey].engagementRate += record.engagementRate
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
    console.error('Admin client analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}