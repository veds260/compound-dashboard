const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkPostsAndUploads() {
  try {
    // Get all posts
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        createdAt: true,
        clientId: true,
        uploadId: true,
        content: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    console.log(`\n📝 Found ${posts.length} recent posts:`)
    posts.forEach(p => {
      console.log(`  - ${p.createdAt} | ${p.content.substring(0, 50)} | uploadId: ${p.uploadId || 'NULL'}`)
    })

    // Get all uploads
    const uploads = await prisma.upload.findMany({
      select: {
        id: true,
        uploadDate: true,
        clientId: true,
        postsCount: true,
        _count: {
          select: { posts: true }
        }
      },
      orderBy: { uploadDate: 'desc' }
    })

    console.log(`\n📤 Found ${uploads.length} uploads:`)
    uploads.forEach(u => {
      console.log(`  - ${u.uploadDate} | DB count: ${u.postsCount} | Actual linked: ${u._count.posts}`)
    })

    // Check if any posts have uploadId set
    const linkedPosts = await prisma.post.count({
      where: { uploadId: { not: null } }
    })

    console.log(`\n🔗 Posts with uploadId set: ${linkedPosts}`)

    // Get total posts
    const totalPosts = await prisma.post.count()
    console.log(`📊 Total posts in database: ${totalPosts}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPostsAndUploads()
