const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const clients = await p.client.findMany({
    select: { id: true, name: true }
  });

  console.log('All clients:');
  clients.forEach(c => console.log('  -', c.name, '-', c.id));

  const uploads = await p.upload.findMany({
    select: {
      id: true,
      clientId: true,
      uploadDate: true,
      client: { select: { name: true } }
    },
    orderBy: { uploadDate: 'desc' }
  });

  console.log('\nAll uploads:');
  uploads.forEach(u => console.log('  -', u.client.name, '-', u.uploadDate));

  await p.$disconnect();
}

run();
