const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkClient2Status() {
  try {
    console.log('🔍 Checking for client2...\n')

    // Check for User
    const user = await prisma.user.findUnique({
      where: { email: 'client2@gmail.com' },
      include: { clientProfile: true }
    })

    console.log('USER RECORD:')
    if (user) {
      console.log(`✅ User exists:`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Has clientProfile: ${user.clientProfile ? 'YES' : 'NO'}`)
      if (user.clientProfile) {
        console.log(`   Client Profile ID: ${user.clientProfile.id}`)
        console.log(`   Agency ID: ${user.clientProfile.agencyId || 'None'}`)
      }
    } else {
      console.log('❌ No User found with email client2@gmail.com')
    }

    console.log('\nCLIENT RECORD:')
    // Check for Client
    const client = await prisma.client.findUnique({
      where: { email: 'client2@gmail.com' },
      include: { user: true }
    })

    if (client) {
      console.log(`✅ Client exists:`)
      console.log(`   ID: ${client.id}`)
      console.log(`   Email: ${client.email}`)
      console.log(`   Name: ${client.name}`)
      console.log(`   Agency ID: ${client.agencyId || 'None'}`)
      console.log(`   User ID: ${client.userId || 'None'}`)
      if (client.user) {
        console.log(`   Linked User: ${client.user.email} (${client.user.role})`)
      } else {
        console.log(`   Linked User: NONE ❌`)
      }
    } else {
      console.log('❌ No Client found with email client2@gmail.com')
    }

    // Provide fix recommendation
    console.log('\n📋 RECOMMENDATIONS:')
    if (!user && !client) {
      console.log('❌ Neither User nor Client exists for client2@gmail.com')
      console.log('   You need to create both records.')
    } else if (user && !client) {
      console.log('⚠️  User exists but no Client record')
      console.log('   Run: node scripts/fix-all-orphaned-clients.js')
    } else if (!user && client) {
      console.log('⚠️  Client exists but no User record')
      console.log('   The client needs a User account to log in.')
    } else if (user && client && !client.userId) {
      console.log('⚠️  Both exist but not linked')
      console.log('   Need to update Client.userId to link them.')
    } else {
      console.log('✅ Everything looks good!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkClient2Status()
