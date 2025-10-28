import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PUT /api/posts/[id]/mark-published - Mark post as published (APPROVED → PUBLISHED)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'AGENCY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized. Agency or Admin access required.' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { tweetUrl } = body

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        client: true
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Verify the post belongs to this agency's client (skip check for admins)
    if (session.user.role === 'AGENCY' && post.client.agencyId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized. This post belongs to another agency.' },
        { status: 403 }
      )
    }

    // Only allow if post is in APPROVED status
    if (post.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Post must be in APPROVED status to mark as published' },
        { status: 400 }
      )
    }

    // Update post status to PUBLISHED
    const updateData: any = {
      status: 'PUBLISHED',
      publishedDate: new Date()
    }

    // If tweet URL provided, save it
    if (tweetUrl) {
      updateData.tweetUrl = tweetUrl
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: 'Post marked as published',
      post: updatedPost
    })
  } catch (error) {
    console.error('Error marking post as published:', error)
    return NextResponse.json(
      { error: 'Failed to mark post as published' },
      { status: 500 }
    )
  }
}
