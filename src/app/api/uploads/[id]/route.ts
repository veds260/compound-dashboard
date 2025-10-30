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

    console.log('========================================')
    console.log('[Undo Upload] START UNDO OPERATION')
    console.log('========================================')
    console.log(`[Undo Upload] Upload to undo:`)
    console.log(`  - ID: ${id}`)
    console.log(`  - Client: ${upload.client.name}`)
    console.log(`  - Upload Date: ${upload.uploadDate}`)
    console.log(`  - Posts Count: ${upload.postsCount}`)

    if (previousUpload) {
      console.log(`[Undo Upload] Previous upload found:`)
      console.log(`  - ID: ${previousUpload.id}`)
      console.log(`  - Upload Date: ${previousUpload.uploadDate}`)
      console.log(`  - Posts Count: ${previousUpload.postsCount}`)
    } else {
      console.log(`[Undo Upload] ⚠️  NO PREVIOUS UPLOAD FOUND`)
    }
    console.log('========================================')

    let restoredCount = 0
    let deletedCount = 0
    let skippedCount = 0

    if (previousUpload) {
      // Get ALL posts for this client
      const allClientPosts = await prisma.post.findMany({
        where: {
          clientId: upload.clientId
        },
        select: {
          id: true,
          typefullyUrl: true,
          content: true,
          createdAt: true,
          uploadId: true,
          status: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      console.log(`\n[Undo Upload] Found ${allClientPosts.length} total posts for client "${upload.client.name}"`)
      console.log('----------------------------------------')

      // Distribution by uploadId
      const postsByUploadId: Record<string, number> = {}
      allClientPosts.forEach(post => {
        const uploadKey = post.uploadId || 'null'
        postsByUploadId[uploadKey] = (postsByUploadId[uploadKey] || 0) + 1
      })

      console.log('[Undo Upload] Posts distribution by uploadId:')
      Object.entries(postsByUploadId).forEach(([uploadId, count]) => {
        console.log(`  - ${uploadId}: ${count} posts`)
      })
      console.log('----------------------------------------')

      // Time analysis
      const previousUploadTime = new Date(previousUpload.uploadDate).getTime()
      const currentUploadTime = new Date(upload.uploadDate).getTime()
      const timeDiffMinutes = (currentUploadTime - previousUploadTime) / 1000 / 60

      console.log(`\n[Undo Upload] Time analysis:`)
      console.log(`  - Previous upload: ${previousUpload.uploadDate}`)
      console.log(`  - Current upload: ${upload.uploadDate}`)
      console.log(`  - Difference: ${timeDiffMinutes.toFixed(2)} minutes`)
      console.log('----------------------------------------')

      console.log(`\n[Undo Upload] Processing each post:\n`)

      for (const post of allClientPosts) {
        const postCreatedTime = new Date(post.createdAt).getTime()
        const createdDuringCurrentUpload = postCreatedTime >= currentUploadTime
        const belongsToCurrentUpload = post.uploadId === id

        try {
          if (createdDuringCurrentUpload) {
            // Post created DURING/AFTER current upload = NEW post from this upload
            console.log(`🗑️  DELETE (NEW): Created ${post.createdAt} >= current upload ${upload.uploadDate}`)
            console.log(`   URL: ${post.typefullyUrl.substring(0, 80)}`)
            console.log(`   UploadId: ${post.uploadId}\n`)

            await prisma.post.delete({
              where: { id: post.id }
            })
            deletedCount++
          } else if (belongsToCurrentUpload) {
            // Post created BEFORE current upload but has current uploadId = was UPDATED by this upload
            console.log(`♻️  RESTORE (UPDATED): Created ${post.createdAt} < current upload ${upload.uploadDate}`)
            console.log(`   URL: ${post.typefullyUrl.substring(0, 80)}`)
            console.log(`   UploadId: ${post.uploadId} → ${previousUpload.id}\n`)

            await prisma.post.update({
              where: { id: post.id },
              data: { uploadId: previousUpload.id }
            })
            restoredCount++
          } else {
            // From older upload, leave it alone
            console.log(`⏭️  SKIP (FROM OLDER UPLOAD): Created ${post.createdAt}, uploadId: ${post.uploadId}`)
            console.log(`   URL: ${post.typefullyUrl.substring(0, 80)}\n`)
            skippedCount++
          }
        } catch (error: any) {
          console.error(`❌ ERROR processing post ${post.id}:`, error.message)
        }
      }

      console.log('========================================')
      console.log('[Undo Upload] OPERATION SUMMARY')
      console.log('========================================')
      console.log(`✅ Restored: ${restoredCount} posts`)
      console.log(`🗑️  Deleted: ${deletedCount} posts`)
      console.log(`⏭️  Skipped: ${skippedCount} posts`)
      console.log('========================================\n')

    } else {
      // No previous upload
      console.log(`\n⚠️  NO PREVIOUS UPLOAD - Deleting all posts for client "${upload.client.name}"`)

      const postsToDelete = await prisma.post.findMany({
        where: { clientId: upload.clientId },
        select: {
          id: true,
          typefullyUrl: true,
          createdAt: true
        }
      })

      console.log(`Found ${postsToDelete.length} posts to delete:`)
      postsToDelete.forEach(post => {
        console.log(`  - ${post.typefullyUrl.substring(0, 80)} (created ${post.createdAt})`)
      })

      const result = await prisma.post.deleteMany({
        where: {
          clientId: upload.clientId
        }
      })
      deletedCount = result.count
      console.log(`✅ Deleted ${deletedCount} posts`)
    }

    // Delete the upload record
    await prisma.upload.delete({
      where: { id }
    })

    const message = previousUpload
      ? `Upload undone successfully. Restored ${restoredCount} posts to previous state and removed ${deletedCount} new posts.${skippedCount > 0 ? ` Skipped ${skippedCount} posts from older uploads.` : ''}`
      : `Upload undone successfully. Deleted ${deletedCount} posts (no previous upload to restore).`

    return NextResponse.json({
      success: true,
      message,
      restoredCount,
      deletedCount,
      skippedCount,
      clientName: upload.client.name,
      debugInfo: {
        uploadId: id,
        previousUploadId: previousUpload?.id || null,
        currentUploadDate: upload.uploadDate,
        previousUploadDate: previousUpload?.uploadDate || null
      }
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
