const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixClient2() {
  try {
    console.log('🔍 Finding client2 user...')

    // Find the client2 user
    const user = await prisma.user.findUnique({
      where: { email: 'client2@gmail.com' },
      include: { clientProfile: true }
    })

    if (!user) {
      console.log('❌ User client2@gmail.com not found')
      return
    }

    console.log('✅ Found user:', { id: user.id, email: user.email, role: user.role })

    if (user.clientProfile) {
      console.log('✅ Client profile already exists:', user.clientProfile.id)
      return
    }

    console.log('📝 Creating Client record for client2...')

    const client = await prisma.client.create({
      data: {
        name: user.name || 'client 2',
        email: user.email,
        userId: user.id,
        agencyId: null // No agency assigned yet
      }
    })

    console.log('✅ Client record created:', { id: client.id, name: client.name, email: client.email })
    console.log('✅ Client2 is now ready! You can assign a writer from the admin panel.')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixClient2()
