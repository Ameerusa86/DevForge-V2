const { PrismaClient } = require('./lib/generated/prisma/client');
const prisma = new PrismaClient();
prisma.course.findFirst().then(c => {
  console.dir(c?.phases, { depth: null });
  return prisma.$disconnect();
}).catch(console.error);
