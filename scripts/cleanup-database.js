const { PrismaClient } = require('@prisma/client')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function cleanupDatabase() {
  console.log('\n⚠️  DATABASE CLEANUP UTILITY ⚠️\n')
  console.log('This will delete data from your database.')
  console.log('Please select what you want to clean:\n')
  console.log('1. Delete ALL posts only')
  console.log('2. Delete ALL posts and feedback')
  console.log('3. Delete ALL users (except admin@example.com)')
  console.log('4. Delete ALL clients')
  console.log('5. Delete EVERYTHING (full reset - keeps only admin user)')
  console.log('6. Cancel\n')

  const choice = await question('Enter your choice (1-6): ')

  if (choice === '6') {
    console.log('Cancelled.')
    rl.close()
    await prisma.$disconnect()
    return
  }

  const confirm = await question('\n⚠️  Are you sure? Type "YES" to confirm: ')

  if (confirm !== 'YES') {
    console.log('Cancelled.')
    rl.close()
    await prisma.$disconnect()
    return
  }

  try {
    console.log('\n🔄 Starting cleanup...')

    switch (choice) {
      case '1':
        // Delete all posts
        const deletedPosts = await prisma.post.deleteMany({})
        console.log(`✅ Deleted ${deletedPosts.count} posts`)
        break

      case '2':
        // Delete all posts (feedback is part of posts)
        const deletedPostsWithFeedback = await prisma.post.deleteMany({})
        console.log(`✅ Deleted ${deletedPostsWithFeedback.count} posts with feedback`)
        break

      case '3':
        // Delete all users except admin
        const deletedUsers = await prisma.user.deleteMany({
          where: {
            email: {
              not: 'compoundops@gmail.com'
            }
          }
        })
        console.log(`✅ Deleted ${deletedUsers.count} users (kept admin)`)
        break

      case '4':
        // Delete all clients (this will cascade delete posts, analytics, etc.)
        const deletedClients = await prisma.client.deleteMany({})
        console.log(`✅ Deleted ${deletedClients.count} clients and their associated data`)
        break

      case '5':
        // Full reset - delete everything except admin user
        console.log('🔄 Starting full database reset...')

        // Delete in correct order due to foreign keys
        await prisma.contentDump.deleteMany({})
        console.log('✅ Cleared content dumps')

        await prisma.followerAnalytics.deleteMany({})
        console.log('✅ Cleared follower analytics')

        await prisma.tweetAnalytics.deleteMany({})
        console.log('✅ Cleared tweet analytics')

        await prisma.analytics.deleteMany({})
        console.log('✅ Cleared analytics')

        await prisma.post.deleteMany({})
        console.log('✅ Cleared posts')

        await prisma.upload.deleteMany({})
        console.log('✅ Cleared uploads')

        await prisma.client.deleteMany({})
        console.log('✅ Cleared clients')

        const deletedNonAdminUsers = await prisma.user.deleteMany({
          where: {
            email: {
              not: 'compoundops@gmail.com'
            }
          }
        })
        console.log(`✅ Cleared ${deletedNonAdminUsers.count} non-admin users`)

        console.log('\n🎉 Full database reset complete!')
        console.log('Admin user preserved: compoundops@gmail.com')
        break

      default:
        console.log('Invalid choice')
    }

    console.log('\n✨ Cleanup completed successfully!')

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

cleanupDatabase()
