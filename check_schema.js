const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.$queryRawUnsafe("PRAGMA table_info(Note)");
  console.log(JSON.stringify(result, null, 2));
}
main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
