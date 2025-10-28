const { PrismaClient } = require('@prisma/client')

async function resetMigrations() {
  const prisma = new PrismaClient()

  try {
    console.log('🔄 Resetting migration state...')
    console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'))

    // Delete migration records
    await prisma.$executeRaw`DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;`
    console.log('✅ Deleted migration records')

    // Drop all tables if they exist
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Upload" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Analytics" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Post" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Client" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "User" CASCADE;`
    await prisma.$executeRaw`DROP TYPE IF EXISTS "Role" CASCADE;`
    await prisma.$executeRaw`DROP TYPE IF EXISTS "PostStatus" CASCADE;`
    console.log('✅ Dropped existing tables and types')

    console.log('🎉 Migration state reset complete!')

  } catch (error) {
    console.error('❌ Error resetting migrations:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetMigrations()