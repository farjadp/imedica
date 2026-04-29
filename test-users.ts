import { prisma } from './apps/backend/src/db/clients.js';
async function main() {
  const users = await prisma.user.findMany();
  console.log(users.map(u => ({ email: u.email, role: u.role })));
}
main().finally(() => prisma.$disconnect());
