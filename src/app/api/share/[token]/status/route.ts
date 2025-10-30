import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PostStatus } from '@prisma/client'

// POST /api/share/[token]/status - Update post status via share link
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const body = await request.json()
    const { status, feedback } = body

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Only allow CLIENT role to change status via share links
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Only clients can change post status via share links' },
        { status: 403 }
      )
    }

    // Validate status
    if (!status || !['APPROVED', 'REJECTED', 'SUGGEST_CHANGES'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Find post by share token
    const post = await prisma.post.findUnique({
      where: { shareToken: token },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            twitterHandle: true,
            profilePicture: true,
            userId: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Verify the logged-in client owns this post
    if (post.client.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to review this post' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = { status: status as PostStatus }

    // Add feedback if status is SUGGEST_CHANGES and feedback is provided
    if (status === 'SUGGEST_CHANGES' && feedback) {
      updateData.feedback = feedback
    }

    // Update post status
    const updatedPost = await prisma.post.update({
      where: { id: post.id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            twitterHandle: true,
            profilePicture: true
          }
        }
      }
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error updating post status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
