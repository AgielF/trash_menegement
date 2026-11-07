import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { addDaysWib, getTodayWib } from '../src/common/utils/wib-date.util';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });
  const collectorRole = await prisma.role.upsert({
    where: { name: 'collector' },
    update: {},
    create: { name: 'collector' },
  });

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bersihku.com' },
    update: {
      fullName: 'Admin Utama',
      passwordHash: adminPasswordHash,
      status: 'approved',
      approvedAt: new Date(),
    },
    create: {
      fullName: 'Admin Utama',
      email: 'admin@bersihku.com',
      passwordHash: adminPasswordHash,
      status: 'approved',
      approvedAt: new Date(),
    },
  });

  const collectorPasswordHash = await bcrypt.hash('password123', 10);
  const collector = await prisma.user.upsert({
    where: { email: 'agiel@example.com' },
    update: {
      fullName: 'Agiel',
      passwordHash: collectorPasswordHash,
      status: 'approved',
      approvedById: admin.id,
      approvedAt: new Date(),
    },
    create: {
      fullName: 'Agiel',
      email: 'agiel@example.com',
      passwordHash: collectorPasswordHash,
      status: 'approved',
      approvedById: admin.id,
      approvedAt: new Date(),
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: collector.id, roleId: collectorRole.id } },
    update: {},
    create: { userId: collector.id, roleId: collectorRole.id },
  });

  await prisma.setting.upsert({
    where: { key: 'kasbon_limit_amount' },
    update: { value: '10000', updatedBy: admin.id },
    create: {
      key: 'kasbon_limit_amount',
      value: '10000',
      updatedBy: admin.id,
    },
  });

  const today = getTodayWib();
  const tomorrow = addDaysWib(today, 1);
  const houses = [
    {
      id: 'a1400000-0000-4000-8000-000000000001',
      ownerName: 'Ibu Siti',
      rt: '02',
      gang: 'Gang Mawar',
      nextDueDate: today,
    },
    {
      id: 'a1400000-0000-4000-8000-000000000002',
      ownerName: 'Pak Lurah',
      rt: '04',
      gang: 'Gang Anggrek',
      nextDueDate: today,
    },
    {
      id: 'a1400000-0000-4000-8000-000000000003',
      ownerName: 'Bapak Budi',
      rt: '01',
      gang: 'Gang Kenanga',
      nextDueDate: tomorrow,
    },
  ];

  for (const house of houses) {
    await prisma.house.upsert({
      where: { id: house.id },
      update: {
        ownerName: house.ownerName,
        rt: house.rt,
        gang: house.gang,
        collectorId: collector.id,
        defaultFee: 5000,
        nextDueDate: house.nextDueDate,
        isActive: true,
      },
      create: {
        ...house,
        collectorId: collector.id,
        defaultFee: 5000,
        isActive: true,
      },
    });
  }

  await prisma.pickupRecord.upsert({
    where: { houseId_dueDate: { houseId: houses[0].id, dueDate: today } },
    update: {
      collectorId: collector.id,
      pickupStatus: 'belum_diambil',
      bagsCount: null,
      feeAmount: 5000,
      paymentStatus: 'belum_bayar',
      pickedAt: null,
    },
    create: {
      houseId: houses[0].id,
      collectorId: collector.id,
      dueDate: today,
      pickupStatus: 'belum_diambil',
      feeAmount: 5000,
      paymentStatus: 'belum_bayar',
    },
  });

  await prisma.pickupRecord.upsert({
    where: { houseId_dueDate: { houseId: houses[1].id, dueDate: today } },
    update: {
      collectorId: collector.id,
      pickupStatus: 'sudah_diambil',
      pickedAt: new Date(),
      bagsCount: 3,
      feeAmount: 5000,
      paymentStatus: 'belum_bayar',
    },
    create: {
      houseId: houses[1].id,
      collectorId: collector.id,
      dueDate: today,
      pickupStatus: 'sudah_diambil',
      pickedAt: new Date(),
      bagsCount: 3,
      feeAmount: 5000,
      paymentStatus: 'belum_bayar',
    },
  });

  console.log('Seeder selesai: roles, users, settings, houses, dan tagihan siap.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
