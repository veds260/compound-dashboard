const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAll() {
  // Get all uploads with their post counts
  const uploads = await prisma.upload.findMany({
    orderBy: { uploadDate: 'desc' },
    take: 10,
    include: {
      client: { select: { name: true } },
      _count: { select: { posts: true } }
    }
  });

  console.log('Recent uploads:');
  uploads.forEach(u => {
    console.log(`  - ${u.client.name} | ${u.uploadDate} | DB count: ${u.postsCount} | Actual: ${u._count.posts}`);
  });

  await prisma.$disconnect();
}

checkAll().catch(console.error);
