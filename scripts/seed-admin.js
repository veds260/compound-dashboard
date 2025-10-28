const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@compound.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'CompoundAdmin123!'
    const adminName = process.env.ADMIN_NAME || 'Super Admin'

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingAdmin) {
      console.log('Admin user already exists:', adminEmail)
      
      // Update role to ADMIN if it's not already
      if (existingAdmin.role !== 'ADMIN') {
        await prisma.user.update({
          where: { email: adminEmail },
          data: { role: 'ADMIN' }
        })
        console.log('Updated existing user role to ADMIN')
      }
      
      return
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Create the admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: 'ADMIN'
      }
    })

    console.log('Admin user created successfully:')
    console.log('Email:', admin.email)
    console.log('Name:', admin.name)
    console.log('Role:', admin.role)
    console.log('\nYou can now log in with these credentials:')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)

  } catch (error) {
    console.error('Error seeding admin user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedAdmin()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })