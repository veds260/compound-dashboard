import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { startPerf, perfLog } from '@/lib/perf-logger'
import { updateClientStats } from '@/lib/stats-manager'

export async function GET(request: NextRequest) {
  const apiStart = startPerf()
  try {
    const sessionStart = startPerf()
    const session = await getServerSession(authOptions)
    perfLog('API /api/posts - getServerSession', sessionStart)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const since = searchParams.get('since')
    const before = searchParams.get('before')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    let whereClause: any = {}

    // Add status filter if provided
    if (status && status !== 'ALL') {
      whereClause.status = status
    }

    // Add date range filters
    if (since || before) {
      whereClause.createdAt = {}
      if (since) {
        whereClause.createdAt.gte = new Date(since)
      }
      if (before) {
        whereClause.createdAt.lt = new Date(before)
      }
    }

    if (session.user.role === 'ADMIN') {
      // Admins can see all posts
      if (clientId) {
        whereClause.clientId = clientId
      }
      // If no clientId, admins see all posts (no where clause needed)
    } else if (session.user.role === 'AGENCY') {
      if (clientId) {
        // Verify client belongs to this agency
        const client = await prisma.client.findFirst({
          where: {
            id: clientId,
            agencyId: session.user.id
          }
        })

        if (!client) {
          return NextResponse.json(
            { error: 'Client not found or unauthorized' },
            { status: 404 }
          )
        }

        whereClause.clientId = clientId
      } else {
        // Get all posts from agency's clients
        const clients = await prisma.client.findMany({
          where: { agencyId: session.user.id },
          select: { id: true }
        })
        whereClause.clientId = {
          in: clients.map(c => c.id)
        }
      }
    } else if (session.user.role === 'CLIENT') {
      // Clients can only see their own posts
      if (!session.user.clientId) {
        return NextResponse.json(
          { error: 'Client ID not found in session. Please log out and log back in.' },
          { status: 403 }
        )
      }
      whereClause.clientId = session.user.clientId
    }

    // Run count and findMany in parallel for better performance
    const dbStart = startPerf()
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
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
        skip,
        take: limit
      }),
      prisma.post.count({ where: whereClause })
    ])
    perfLog('API /api/posts - DB query (posts + count)', dbStart)

    perfLog('API /api/posts - TOTAL', apiStart)

    // Return with pagination metadata
    // Use stale-while-revalidate for better UX - serve cached content while fetching fresh
    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + posts.length < totalCount
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=5, stale-while-revalidate=30',
      }
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'AGENCY') {
      return NextResponse.json(
        { error: 'Unauthorized. Agency access required.' },
        { status: 401 }
      )
    }

    const { content, tweetText, scheduledDate, typefullyUrl, clientId } = await request.json()

    if (!content || !typefullyUrl || !clientId) {
      return NextResponse.json(
        { error: 'Content, Typefully URL, and client ID are required' },
        { status: 400 }
      )
    }

    // Verify client belongs to this agency
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        agencyId: session.user.id
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    const post = await prisma.post.create({
      data: {
        content,
        tweetText: tweetText || null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        typefullyUrl,
        clientId,
        status: 'PENDING'
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            timezone: true
          }
        }
      }
    })

    // Update cached stats
    updateClientStats(clientId).catch(err =>
      console.error('Failed to update stats:', err)
    )

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}