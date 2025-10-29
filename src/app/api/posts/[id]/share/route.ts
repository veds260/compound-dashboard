import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'

// POST /api/posts/[id]/share - Generate or get share link
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'AGENCY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if post exists and user has access
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        client: true
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check authorization
    if (session.user.role === 'AGENCY' && post.client.agencyId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // If share token already exists, return it
    if (post.shareToken) {
      const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${post.shareToken}`
      return NextResponse.json({ shareToken: post.shareToken, shareUrl })
    }

    // Generate new share token
    const shareToken = randomBytes(16).toString('hex')

    // Update post with share token
    const updatedPost = await prisma.post.update({
      where: { id },
      data: { shareToken }
    })

    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${shareToken}`

    return NextResponse.json({ shareToken: updatedPost.shareToken, shareUrl })
  } catch (error) {
    console.error('Error generating share link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/posts/[id]/share - Revoke share link
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'AGENCY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if post exists and user has access
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        client: true
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check authorization
    if (session.user.role === 'AGENCY' && post.client.agencyId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Remove share token
    await prisma.post.update({
      where: { id },
      data: { shareToken: null }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking share link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
