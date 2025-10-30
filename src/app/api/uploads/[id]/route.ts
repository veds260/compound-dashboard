import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// DELETE /api/uploads/[id] - Undo an upload (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { id } = params

    // Get the upload to verify it exists
    const upload = await prisma.upload.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            name: true,
            id: true
          }
        }
      }
    })

    if (!upload) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      )
    }

    // Find the previous upload for this client (by date, before current upload)
    const previousUpload = await prisma.upload.findFirst({
      where: {
        clientId: upload.clientId,
        uploadDate: {
          lt: upload.uploadDate
        }
      },
      orderBy: {
        uploadDate: 'desc'
      }
    })

    console.log(`[Undo Upload] Current upload: ${id}, Previous upload: ${previousUpload?.id || 'none'}`)

    // Get posts associated with this upload
    const postsToHandle = await prisma.post.findMany({
      where: {
        uploadId: id
      },
      select: {
        id: true,
        typefullyUrl: true,
        uploadId: true
      }
    })

    console.log(`[Undo Upload] Found ${postsToHandle.length} posts with current uploadId`)

    let restoredCount = 0
    let deletedCount = 0

    if (previousUpload) {
      // Strategy: Restore posts to previous upload state
      // Check which posts existed in previous upload
      const previousPosts = await prisma.post.findMany({
        where: {
          clientId: upload.clientId,
          OR: [
            { uploadId: previousUpload.id },
            { uploadId: null } // Include orphaned posts that might belong to previous upload
          ]
        },
        select: {
          id: true,
          typefullyUrl: true
        }
      })

      const previousUrlsMap = new Map(previousPosts.map(p => [p.typefullyUrl, p.id]))

      console.log(`[Undo Upload] Previous upload had ${previousPosts.length} posts`)

      // For each post in current upload:
      // 1. If it existed in previous upload (same URL), it was updated → restore its uploadId
      // 2. If it's new (not in previous), delete it
      for (const post of postsToHandle) {
        if (previousUrlsMap.has(post.typefullyUrl)) {
          // This post existed before, restore its uploadId to previous
          await prisma.post.update({
            where: { id: post.id },
            data: { uploadId: previousUpload.id }
          })
          restoredCount++
        } else {
          // This is a new post from current upload, delete it
          await prisma.post.delete({
            where: { id: post.id }
          })
          deletedCount++
        }
      }

      console.log(`[Undo Upload] Restored ${restoredCount} posts to previous upload, deleted ${deletedCount} new posts`)
    } else {
      // No previous upload, delete all posts from this upload
      deletedCount = postsToHandle.length
      await prisma.post.deleteMany({
        where: {
          uploadId: id
        }
      })
      console.log(`[Undo Upload] No previous upload found, deleted all ${deletedCount} posts`)
    }

    // Delete the upload record
    await prisma.upload.delete({
      where: { id }
    })

    const message = previousUpload
      ? `Upload undone successfully. Restored ${restoredCount} posts to previous state and removed ${deletedCount} new posts.`
      : `Upload undone successfully. Deleted ${deletedCount} posts (no previous upload to restore).`

    return NextResponse.json({
      success: true,
      message,
      restoredCount,
      deletedCount,
      clientName: upload.client.name
    })
  } catch (error: any) {
    console.error('Error undoing upload:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json(
      {
        error: 'Failed to undo upload',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}
