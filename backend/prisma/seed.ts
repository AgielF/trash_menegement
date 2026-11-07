import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Role admin & collector (upsert agar idempotent)
  await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });
  const collectorRole = await prisma.role.upsert({
    where: { name: 'collector' },
    update: {},
    create: { name: 'collector' },
  });

  // 2. User admin default (upsert agar idempotent)
  const passwordHash = await bcrypt.hash('admin123', 10);

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bersihku.com' },
    update: {},
    create: {
      fullName: 'Admin Utama',
      email: 'admin@bersihku.com',
      passwordHash,
      status: 'approved',
      approvedAt: new Date(),
      roles: {
        create: [{ roleId: adminRole.id }],
      },
    },
  });

  console.log('Roles siap: admin, collector');
  console.log(`Admin default siap: ${admin.email} (password: admin123)`);
  console.log(`Collector role id: ${collectorRole.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
