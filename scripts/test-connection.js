const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  const prisma = new PrismaClient()

  try {
    console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'))

    // Test basic connection
    console.log('🧪 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Connected to database successfully!')

    // Check if tables exist
    console.log('🔍 Checking if tables exist...')

    try {
      const userCount = await prisma.user.count()
      console.log(`✅ User table exists! Current count: ${userCount}`)
    } catch (error) {
      console.log('❌ User table does not exist:', error.message)
    }

    // List all tables
    console.log('📋 Listing all tables...')
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `
    console.log('Tables found:', tables)

  } catch (error) {
    console.error('❌ Database connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()