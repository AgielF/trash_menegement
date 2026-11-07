import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DAY_MS,
  WIB_OFFSET_MS,
  addDaysWib,
  getTodayWib,
} from '../../common/utils/wib-date.util';
import { RecordPickupDto } from './dto/record-pickup.dto';
import { SkipRecordDto } from './dto/skip-record.dto';

@Injectable()
export class PickupsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * F5 — Mulai ambil sampah.
   *
   * 1. Buat/lanjut sesi hari ini (status `in_progress`).
   * 2. Ambil semua rumah aktif petugas dengan `nextDueDate <= hari ini`,
   *    lalu buat `PickupRecord` per tanggal jatuh tempo yang terlewat
   *    (termasuk yang terbawa), sambil menggeser `nextDueDate`
   *    sebanyak `intervalDays` sampai melewati hari ini.
   */
  async startDay(collectorId: string) {
    const today = getTodayWib();

    const session = await this.prisma.$transaction(async (tx) => {
      const currentSession = await tx.collectionSession.upsert({
        where: {
          collectorId_sessionDate: { collectorId, sessionDate: today },
        },
        create: {
          collectorId,
          sessionDate: today,
          status: 'in_progress',
          startedAt: new Date(),
        },
        update: { status: 'in_progress' },
      });

      const houses = await tx.house.findMany({
        where: {
          collectorId,
          isActive: true,
          nextDueDate: { lte: today },
        },
      });

      for (const house of houses) {
        let dueDate = house.nextDueDate as Date;

        // Buat record untuk setiap tanggal jatuh tempo yang terlewat,
        // sampai nextDueDate melewati hari ini.
        while (dueDate <= today) {
          // Atomic upsert (INSERT ... ON CONFLICT): double-click/double
          // request paralel tidak menghasilkan duplikat maupun error P2002;
          // record yang sudah ada (mis. sudah_diambil) tidak ditimpa.
          await tx.pickupRecord.upsert({
            where: { houseId_dueDate: { houseId: house.id, dueDate } },
            create: {
              houseId: house.id,
              collectorId,
              dueDate,
              pickupStatus: 'belum_diambil',
              paymentStatus: 'belum_bayar',
              feeAmount: house.defaultFee,
            },
            update: {},
          });

          dueDate = addDaysWib(dueDate, house.intervalDays);
        }

        await tx.house.update({
          where: { id: house.id },
          data: { nextDueDate: dueDate },
        });
      }

      return currentSession;
    });

    const housesToday = await this.getTodayHouses(collectorId);

    return { session, houses: housesToday };
  }

  /**
   * F11 — Catat pengambilan sampah.
   *
   * Record harus milik petugas, belum diambil, lalu ditandai
   * `sudah_diambil` dengan waktu ambil dan jumlah karung.
   * Rumah yang sebelumnya di-skip boleh langsung diambil lewat sini.
   */
  async recordPickup(
    recordId: string,
    collectorId: string,
    dto: RecordPickupDto,
  ) {
    const record = await this.prisma.pickupRecord.findUnique({
      where: { id: recordId },
    });
    if (!record) {
      throw new NotFoundException('Catatan pengambilan tidak ditemukan');
    }
    if (record.collectorId !== collectorId) {
      throw new ForbiddenException('Catatan ini bukan milik petugas Anda');
    }
    if (record.pickupStatus === 'sudah_diambil') {
      throw new BadRequestException('Pengambilan sudah dicatat sebelumnya');
    }

    return this.prisma.pickupRecord.update({
      where: { id: record.id },
      data: {
        pickupStatus: 'sudah_diambil',
        pickedAt: new Date(),
        bagsCount: dto.bagsCount,
      },
      include: {
        house: {
          select: {
            id: true,
            ownerName: true,
            rt: true,
            gang: true,
            addressNote: true,
          },
        },
      },
    });
  }

  /**
   * F8 — Skip rumah dengan alasan (alasan wajib), berlaku untuk hari itu.
   *
   * Jika hari ini (WIB) sudah ada skip untuk record ini, alasannya
   * diperbarui; jika belum, dibuat baris baru. Esok hari rumah muncul
   * kembali sebagai terbawa — due_date tidak berubah.
   */
  async skipRecord(recordId: string, collectorId: string, dto: SkipRecordDto) {
    const record = await this.prisma.pickupRecord.findUnique({
      where: { id: recordId },
    });
    if (!record) {
      throw new NotFoundException('Catatan pengambilan tidak ditemukan');
    }
    if (record.collectorId !== collectorId) {
      throw new ForbiddenException('Catatan ini bukan milik petugas Anda');
    }
    if (record.pickupStatus === 'sudah_diambil') {
      throw new BadRequestException('Rumah sudah diambil, tidak bisa di-skip');
    }

    const today = getTodayWib();
    const skip = await this.prisma.pickupSkip.upsert({
      where: { recordId_skipDate: { recordId: record.id, skipDate: today } },
      update: { reason: dto.reason },
      create: {
        recordId: record.id,
        skipDate: today,
        reason: dto.reason,
      },
    });

    return skip;
  }

  /**
   * F16 lanjutan / Beranda — Ringkasan progres, karung, dan uang.
   *
   * - Progres hari ini: record `sudah_diambil` hari ini ÷
   *   (sudah_diambil hari ini + belum_diambil milik petugas), tanpa memandang rentang
   *   `range` (selalu milik hari WIB).
   * - Total karung: `SUM(bags_count)` pada rentang (picked_at).
   * - Total uang: `SUM(amount)` pembayaran aktif pada rentang (paid_at).
   * - Rentang `week` = Senin–Minggu berjalan, `month` = bulan kalender
   *   berjalan, keduanya dihitung pada zona WIB.
   */
  async getStats(collectorId: string, range: 'today' | 'week' | 'month') {
    const today = getTodayWib();

    let rangeStartWib: Date;
    let rangeEndWib: Date;
    if (range === 'week') {
      const daysSinceMonday = (today.getUTCDay() + 6) % 7;
      const monday = addDaysWib(today, -daysSinceMonday);
      rangeStartWib = monday;
      rangeEndWib = addDaysWib(monday, 7);
    } else if (range === 'month') {
      const year = today.getUTCFullYear();
      const month = today.getUTCMonth();
      rangeStartWib = new Date(Date.UTC(year, month, 1));
      rangeEndWib = new Date(Date.UTC(year, month + 1, 1));
    } else {
      rangeStartWib = today;
      rangeEndWib = addDaysWib(today, 1);
    }

    // Rentang instant UTC: 00:00 WIB rangeStart → 00:00 WIB rangeEnd.
    const start = new Date(rangeStartWib.getTime() - WIB_OFFSET_MS);
    const end = new Date(rangeEndWib.getTime() - WIB_OFFSET_MS);

    const [collectedToday, pending, bags, money] = await Promise.all([
      this.prisma.pickupRecord.count({
        where: {
          collectorId,
          pickupStatus: 'sudah_diambil',
          pickedAt: { gte: start, lt: end },
        },
      }),
      this.prisma.pickupRecord.count({
        where: { collectorId, pickupStatus: 'belum_diambil' },
      }),
      this.prisma.pickupRecord.aggregate({
        _sum: { bagsCount: true },
        where: {
          collectorId,
          pickupStatus: 'sudah_diambil',
          pickedAt: { gte: start, lt: end },
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          receivedBy: collectorId,
          voidedAt: null,
          paidAt: { gte: start, lt: end },
        },
      }),
    ]);

    const totalCollected = collectedToday;
    const denominator = totalCollected + pending;
    const percentage =
      denominator === 0 ? 0 : (totalCollected / denominator) * 100;

    return {
      range,
      totalCollected,
      pending,
      progress: Math.round(percentage * 10) / 10,
      totalBags: bags._sum.bagsCount ?? 0,
      totalMoney: money._sum.amount ?? 0,
    };
  }

  /**
   * F6 — Daftar rumah hari ini.
   *
   * Record terbuka (belum diambil, termasuk yang terbawa) ATAU record yang
   * diambil hari ini (WIB). Diurutkan berdasarkan dueDate terlama di atas.
   */
  async getTodayHouses(collectorId: string) {
    const today = getTodayWib();
    const startOfTodayWib = new Date(today.getTime() - WIB_OFFSET_MS); // 00:00 WIB dalam UTC
    const endOfTodayWib = new Date(startOfTodayWib.getTime() + DAY_MS); // 00:00 besok WIB

    return this.prisma.pickupRecord.findMany({
      where: {
        collectorId,
        // Soft delete: rumah yang dihapus tidak muncul lagi di daftar hari ini.
        house: { deletedAt: null },
        OR: [
          { pickupStatus: 'belum_diambil' },
          {
            pickupStatus: 'sudah_diambil',
            pickedAt: { gte: startOfTodayWib, lt: endOfTodayWib },
          },
        ],
      },
      include: {
        house: {
          select: {
            id: true,
            ownerName: true,
            rt: true,
            gang: true,
            addressNote: true,
          },
        },
        skips: { where: { skipDate: today } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
