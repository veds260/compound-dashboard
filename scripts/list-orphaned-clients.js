const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listOrphanedClients() {
  try {
    console.log('🔍 Finding all CLIENT role users...')

    const clientUsers = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      include: { clientProfile: true }
    })

    console.log(`\n📊 Found ${clientUsers.length} CLIENT role users:\n`)

    for (const user of clientUsers) {
      console.log(`User: ${user.name} (${user.email})`)
      console.log(`  ID: ${user.id}`)
      console.log(`  Has Client Profile: ${user.clientProfile ? 'YES (' + user.clientProfile.id + ')' : 'NO ❌'}`)
      if (user.clientProfile) {
        console.log(`  Agency Assigned: ${user.clientProfile.agencyId ? 'YES' : 'NO'}`)
      }
      console.log('')
    }

    const orphaned = clientUsers.filter(u => !u.clientProfile)
    if (orphaned.length > 0) {
      console.log(`\n⚠️  Found ${orphaned.length} orphaned CLIENT users (no Client profile):`)
      orphaned.forEach(u => console.log(`  - ${u.name} (${u.email}) - ID: ${u.id}`))
      console.log('\nThese users need Client records created.')
    } else {
      console.log('\n✅ All CLIENT users have corresponding Client profiles!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listOrphanedClients()
