const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixLargeProfilePictures() {
  console.log('🔍 Checking for users with large profile pictures...')

  try {
    const users = await prisma.user.findMany({
      where: {
        profilePicture: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        profilePicture: true
      }
    })

    console.log(`Found ${users.length} users with profile pictures`)

    let fixedCount = 0

    for (const user of users) {
      if (user.profilePicture) {
        const size = user.profilePicture.length
        console.log(`User ${user.email}: ${size} bytes`)

        // If profile picture is larger than 200KB, remove it
        if (size > 200000) {
          console.log(`  ⚠️  Too large! Removing...`)
          await prisma.user.update({
            where: { id: user.id },
            data: { profilePicture: null }
          })
          fixedCount++
        }
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} users with oversized profile pictures`)
    console.log('The site should now work correctly.')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixLargeProfilePictures()
