const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetAdmin() {
  try {
    const adminEmail = 'admin@compound.com'
    const adminPassword = 'Admin123!'
    const adminName = 'Super Admin'

    console.log('Resetting admin user...')

    // Delete existing admin user if exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingAdmin) {
      await prisma.user.delete({
        where: { email: adminEmail }
      })
      console.log('Deleted existing admin user')
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    console.log('Password hashed successfully')

    // Create the admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: 'ADMIN'
      }
    })

    console.log('\n✅ Admin user created successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email:', adminEmail)
    console.log('🔑 Password:', adminPassword)
    console.log('👤 Name:', admin.name)
    console.log('🛡️  Role:', admin.role)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n🌐 Login at: http://localhost:3001/login')
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n')

  } catch (error) {
    console.error('❌ Error resetting admin user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

resetAdmin()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
