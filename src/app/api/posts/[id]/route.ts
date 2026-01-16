import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { status, feedback, content, scheduledDate, typefullyUrl, tweetText } = await request.json()

    // Get only the fields needed for permission check
    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        clientId: true,
        client: {
          select: {
            agencyId: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check permissions
    let hasAccess = false

    if (session.user.role === 'ADMIN') {
      hasAccess = true
    } else if (session.user.role === 'AGENCY') {
      hasAccess = post.client.agencyId === session.user.id
    } else if (session.user.role === 'CLIENT') {
      // For client users, check if this user is linked to the client that owns this post
      // We need to check if the user's clientProfile id matches the post's clientId
      if (!session.user.clientId) {
        return NextResponse.json(
          { error: 'Client ID not found in session. Please log out and log back in.' },
          { status: 403 }
        )
      }
      hasAccess = post.clientId === session.user.clientId
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Build update data
    const updateData: any = {}

    if (status) updateData.status = status
    if (feedback !== undefined) updateData.feedback = feedback
    if (content) updateData.content = content
    if (typefullyUrl) updateData.typefullyUrl = typefullyUrl
    if (tweetText !== undefined) updateData.tweetText = tweetText
    if (scheduledDate !== undefined) {
      updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            timezone: true,
            twitterHandle: true,
            profilePicture: true
          }
        }
      }
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Get the post first to check permissions
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            agencyId: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Admins can delete any post, agencies can only delete their own
    if (session.user.role === 'AGENCY' && post.client.agencyId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    await prisma.post.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}