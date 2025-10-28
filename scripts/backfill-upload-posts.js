const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function backfillUploadPosts() {
  console.log('🔄 Starting backfill of upload post counts...')

  try {
    // Get all uploads
    const uploads = await prisma.upload.findMany({
      orderBy: {
        uploadDate: 'asc'
      }
    })

    console.log(`📊 Found ${uploads.length} uploads to process`)

    for (const upload of uploads) {
      // Get all posts for this client created around the same time as the upload
      // We'll match posts created within 5 minutes of the upload
      const uploadTime = new Date(upload.uploadDate)
      const fiveMinutesBefore = new Date(uploadTime.getTime() - 5 * 60 * 1000)
      const fiveMinutesAfter = new Date(uploadTime.getTime() + 5 * 60 * 1000)

      // Find posts that don't have an uploadId yet and were created around this upload time
      const posts = await prisma.post.findMany({
        where: {
          clientId: upload.clientId,
          uploadId: null,
          createdAt: {
            gte: fiveMinutesBefore,
            lte: fiveMinutesAfter
          }
        }
      })

      if (posts.length > 0) {
        console.log(`\n📝 Upload: ${upload.id}`)
        console.log(`   Client: ${upload.clientId}`)
        console.log(`   Date: ${upload.uploadDate}`)
        console.log(`   Found ${posts.length} posts to link`)

        // Update all these posts to link to this upload
        await prisma.post.updateMany({
          where: {
            id: {
              in: posts.map(p => p.id)
            }
          },
          data: {
            uploadId: upload.id
          }
        })

        // Update the upload's post count
        await prisma.upload.update({
          where: {
            id: upload.id
          },
          data: {
            postsCount: posts.length
          }
        })

        console.log(`   ✅ Linked ${posts.length} posts to upload`)
      } else {
        console.log(`\n⏭️  Upload ${upload.id}: No posts found in time window`)
      }
    }

    console.log('\n✅ Backfill complete!')
  } catch (error) {
    console.error('❌ Error during backfill:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

backfillUploadPosts()
