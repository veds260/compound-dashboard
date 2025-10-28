const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixAllOrphanedClients() {
  try {
    console.log('🔍 Finding all CLIENT role users without Client profiles...\n')

    const clientUsers = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      include: { clientProfile: true }
    })

    const orphaned = clientUsers.filter(u => !u.clientProfile)

    if (orphaned.length === 0) {
      console.log('✅ All CLIENT users already have Client profiles!')
      return
    }

    console.log(`Found ${orphaned.length} orphaned CLIENT users:\n`)

    for (const user of orphaned) {
      console.log(`📝 Creating Client record for: ${user.name} (${user.email})`)

      const client = await prisma.client.create({
        data: {
          name: user.name || user.email.split('@')[0],
          email: user.email,
          userId: user.id,
          agencyId: null // No agency assigned yet
        }
      })

      console.log(`✅ Created Client: ${client.name} (ID: ${client.id})`)
      console.log(`   This client can now be assigned a writer from the admin panel.\n`)
    }

    console.log(`\n✅ Fixed ${orphaned.length} orphaned CLIENT user(s)!`)

  } catch (error) {
    console.error('❌ Error:', error)
    if (error.code === 'P2002') {
      console.error('   This email already has a Client record. The issue might be a userId mismatch.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

fixAllOrphanedClients()
