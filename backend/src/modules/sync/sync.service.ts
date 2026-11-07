import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PushSyncPayloadDto, SyncItem } from './dto/push-sync.dto';

/** Jenis entitas dari perangkat offline: houses, pickups, payments. */
type PushPayload = PushSyncPayloadDto;

interface CollectionSync {
  synced: string[];
  conflicts: string[];
}

const EPOCH = new Date(0);

/** Konversi aman ke number (nilai lokal bisa datang sebagai string). */
function asNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Konversi aman ke string; undefined bila tipe tak dikenali. */
function asText(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

/** Konversi aman ke Date; null bila tidak valid. */
function asDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Kasus khusus: nomor serial tanggal Excel/lokal? Tidak dipakai di sini. */
function asInt(value: unknown): number | null {
  const n = asNumber(value);
  return n === null ? null : Math.trunc(n);
}

/** Waktu `updatedAt` milik perangkat (bila tidak ada, dianggap paling lama). */
function clientUpdatedAt(item: SyncItem): Date {
  return asDate(item.updatedAt) ?? EPOCH;
}

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * F12 — Terima antrean sinkronisasi dari perangkat offline.
   *
   * - `payments` append-only: langsung ditambahkan (idempoten by id).
   * - `houses`/`pickups`: dibandingkan lewat `updatedAt`;
   *   bila data server lebih baru (mis. rumah dipindahkan admin),
   *   perubahan perangkat ditandai sebagai konflik.
   */
  async pushOfflineData(payload: PushPayload, collectorId: string) {
    const houses = await this.syncHouses(collectorId, payload.houses ?? []);
    const pickups = await this.syncPickups(collectorId, payload.pickups ?? []);
    const payments = await this.syncPayments(
      collectorId,
      payload.payments ?? [],
    );

    return {
      syncedAt: new Date(),
      houseSynced: houses.synced.length,
      houseConflicts: houses.conflicts,
      pickupSynced: pickups.synced.length,
      pickupConflicts: pickups.conflicts,
      paymentSynced: payments.synced.length,
      paymentConflicts: payments.conflicts,
    };
  }

  /**
   * F12 lanjutan — Tarik perubahan terbaru dari server ke perangkat offline.
   *
   * Mengembalikan `houses` dan `pickups` milik petugas tersebut (plus skip
   * per record) serta seluruh `settings` global yang `updatedAt` lebih baru
   * dari `lastSyncedAt`. Bila `lastSyncedAt` kosong, semua data dikirim.
   */
  async pullOfflineData(collectorId: string, lastSyncedAt?: string) {
    let since: Date | null = null;
    if (lastSyncedAt) {
      const parsed = new Date(lastSyncedAt);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException(
          'Format lastSyncedAt tidak valid (ISO 8601)',
        );
      }
      since = parsed;
    }
    const updatedSince = since ? { gt: since } : undefined;

    const houses = await this.prisma.house.findMany({
      where: {
        collectorId,
        // Soft delete: rumah yang sudah dihapus tidak dikirim ke perangkat.
        deletedAt: null,
        ...(updatedSince ? { updatedAt: updatedSince } : {}),
      },
      orderBy: { updatedAt: 'asc' },
    });

    const pickups = (
      await this.prisma.pickupRecord.findMany({
        where: {
          collectorId,
          ...(updatedSince ? { updatedAt: updatedSince } : {}),
        },
        include: { skips: true },
        orderBy: { updatedAt: 'asc' },
      })
    ).map((record) => ({
      id: record.id,
      houseId: record.houseId,
      collectorId: record.collectorId,
      dueDate: record.dueDate,
      pickupStatus: record.pickupStatus,
      pickedAt: record.pickedAt,
      bagsCount: record.bagsCount,
      feeAmount: record.feeAmount,
      paymentStatus: record.paymentStatus,
      updatedAt: record.updatedAt,
      skips: record.skips,
    }));

    // Pengaturan (mis. batas kasbon) bersifat global, dibaca semua petugas.
    const settings = await this.prisma.setting.findMany({
      where: updatedSince ? { updatedAt: updatedSince } : undefined,
      orderBy: { key: 'asc' },
    });

    return {
      since: since ? since.toISOString() : null,
      serverTime: new Date(),
      houses,
      pickups,
      settings,
    };
  }

  private async syncHouses(
    collectorId: string,
    items: SyncItem[],
  ): Promise<CollectionSync> {
    const synced: string[] = [];
    const conflicts: string[] = [];

    for (const [index, item] of items.entries()) {
      const id = String(item.id ?? `index-${index}`);
      try {
        const server = await this.prisma.house.findUnique({ where: { id } });

        // IDOR guard: rumah milik petugas lain tidak boleh diubah/overridden.
        if (server && server.collectorId !== collectorId) {
          conflicts.push(id);
          continue;
        }

        if (server && server.updatedAt > clientUpdatedAt(item)) {
          conflicts.push(id); // bentrok: server lebih baru (mis. di-reassign admin)
          continue;
        }

        const data = {
          ownerName: asText(item.ownerName),
          rt: asText(item.rt),
          gang: asText(item.gang),
          addressNote: asText(item.addressNote),
          defaultFee: asInt(item.defaultFee) ?? undefined,
          intervalDays: asInt(item.intervalDays) ?? undefined,
          nextDueDate: asDate(item.nextDueDate) ?? undefined,
          isActive:
            typeof item.isActive === 'boolean' ? item.isActive : undefined,
        };

        if (!server) {
          await this.prisma.house.create({
            data: {
              id,
              collectorId,
              ...data,
            } as Prisma.HouseUncheckedCreateInput,
          });
        } else {
          await this.prisma.house.update({ where: { id }, data });
        }
        synced.push(id);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2002' || error.code === 'P2003')
        ) {
          conflicts.push(id); // duplikat/relasi tidak valid
          continue;
        }
        throw error;
      }
    }

    return { synced, conflicts };
  }

  private async syncPickups(
    collectorId: string,
    items: SyncItem[],
  ): Promise<CollectionSync> {
    const synced: string[] = [];
    const conflicts: string[] = [];

    for (const [index, item] of items.entries()) {
      const id = String(item.id ?? `index-${index}`);
      try {
        const server = await this.prisma.pickupRecord.findUnique({
          where: { id },
        });

        // IDOR guard: record milik petugas lain tidak boleh diubah.
        if (server && server.collectorId !== collectorId) {
          conflicts.push(id);
          continue;
        }

        if (server && server.updatedAt > clientUpdatedAt(item)) {
          conflicts.push(id);
          continue;
        }

        const dueDate = asDate(item.dueDate);
        if (server || dueDate) {
          const data = {
            pickupStatus: asText(item.pickupStatus),
            pickedAt: asDate(item.pickedAt) ?? undefined,
            bagsCount: asInt(item.bagsCount) ?? undefined,
            feeAmount: asInt(item.feeAmount) ?? undefined,
            paymentStatus: asText(item.paymentStatus),
          };

          if (!server) {
            if (!dueDate) {
              conflicts.push(id);
              continue;
            }
            // IDOR guard: record baru hanya boleh jatuh pada rumah milik
            // petugas yang melakukan push (offline craft rumah orang = konflik).
            const house = await this.prisma.house.findUnique({
              where: { id: asText(item.houseId) ?? '' },
            });
            if (!house || house.collectorId !== collectorId) {
              conflicts.push(id);
              continue;
            }
            await this.prisma.pickupRecord.create({
              data: {
                id,
                houseId: String(item.houseId),
                collectorId,
                dueDate,
                ...data,
              } as Prisma.PickupRecordUncheckedCreateInput,
            });
          } else {
            await this.prisma.pickupRecord.update({ where: { id }, data });
          }
          synced.push(id);
        } else {
          conflicts.push(id); // record baru tanpa due_date tidak bisa dibuat
        }
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2002' || error.code === 'P2003')
        ) {
          conflicts.push(id);
          continue;
        }
        throw error;
      }
    }

    return { synced, conflicts };
  }

  private async syncPayments(
    collectorId: string,
    items: SyncItem[],
  ): Promise<CollectionSync> {
    const synced: string[] = [];
    const conflicts: string[] = [];

    for (const [index, item] of items.entries()) {
      const id = String(item.id ?? `index-${index}`);
      try {
        const server = await this.prisma.payment.findUnique({ where: { id } });

        if (server) {
          // append-only: pembayaran yang sudah ada tidak diubah (idempoten).
          synced.push(id);
          continue;
        }

        const record = await this.prisma.pickupRecord.findUnique({
          where: { id: asText(item.recordId) ?? '' },
        });
        if (!record) {
          conflicts.push(id); // catatan pengambilan tidak ada di server
          continue;
        }
        if (record.collectorId !== collectorId) {
          // IDOR guard: pembayaran hanya untuk record milik petugas ini.
          conflicts.push(id);
          continue;
        }

        const amount = asInt(item.amount);
        if (amount === null) {
          conflicts.push(id);
          continue;
        }

        await this.prisma.payment.create({
          data: {
            id,
            recordId: record.id,
            receivedBy: collectorId,
            amount,
            paidAt: asDate(item.paidAt) ?? new Date(),
            note: asText(item.note),
          },
        });
        // Perbaiki status pembayaran catatan terkait (kasbon bisa lunas).
        await this.prisma.$transaction(async (tx) => {
          const target = await tx.pickupRecord.findUniqueOrThrow({
            where: { id: record.id },
            include: {
              payments: { where: { voidedAt: null }, select: { amount: true } },
            },
          });
          const activePaid = target.payments.reduce(
            (sum, p) => sum + p.amount,
            0,
          );
          const paymentStatus =
            activePaid <= 0
              ? 'belum_bayar'
              : activePaid >= target.feeAmount
                ? 'lunas'
                : 'sebagian';
          await tx.pickupRecord.update({
            where: { id: record.id },
            data: { paymentStatus },
          });
        });
        synced.push(id);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2002' || error.code === 'P2003')
        ) {
          conflicts.push(id);
          continue;
        }
        throw error;
      }
    }

    return { synced, conflicts };
  }
}
