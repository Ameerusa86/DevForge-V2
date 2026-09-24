import { PrismaClient } from './lib/generated/prisma/client/index.js';
const prisma = new PrismaClient();
prisma.course.findFirst().then(c => {
  console.log(c?.id);
  return prisma.$disconnect();
}).catch(console.error);
