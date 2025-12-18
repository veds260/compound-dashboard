import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/calendar/[token] - Get posts for shared calendar
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    // Find client by calendar share token
    const client = await prisma.client.findUnique({
      where: { calendarShareToken: token },
      select: {
        id: true,
        name: true,
        email: true,
        twitterHandle: true,
        profilePicture: true,
        timezone: true
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Invalid or expired calendar link' },
        { status: 404 }
      )
    }

    // Fetch all posts for this client that have scheduled or published dates
    const posts = await prisma.post.findMany({
      where: {
        clientId: client.id,
        OR: [
          { scheduledDate: { not: null } },
          { publishedDate: { not: null } }
        ]
      },
      select: {
        id: true,
        content: true,
        tweetText: true,
        scheduledDate: true,
        publishedDate: true,
        typefullyUrl: true,
        status: true,
        media: true,
        createdAt: true
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Transform posts to include client info
    const postsWithClient = posts.map(post => ({
      ...post,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        twitterHandle: client.twitterHandle,
        profilePicture: client.profilePicture,
        timezone: client.timezone
      }
    }))

    return NextResponse.json({
      client,
      posts: postsWithClient
    })
  } catch (error) {
    console.error('Error fetching shared calendar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
