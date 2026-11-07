import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { CreatePaymentDto } from './dto/create-payment.dto';

const KASBON_LIMIT_KEY = 'kasbon_limit_amount';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * F7/F13 — Catat pembayaran (penuh / sebagian / pelunasan kasbon).
   * Pembayaran bersifat append-only; uang yang masuk dibatasi sebesar sisa catatan.
   */
  async addPayment(dto: CreatePaymentDto, receivedBy: string) {
    const record = await this.prisma.pickupRecord.findUnique({
      where: { id: dto.recordId },
    });
    if (!record) {
      throw new NotFoundException('Catatan pengambilan tidak ditemukan');
    }
    if (record.collectorId !== receivedBy) {
      throw new ForbiddenException('Catatan ini bukan milik petugas Anda');
    }
    if (record.pickupStatus !== 'sudah_diambil') {
      throw new BadRequestException(
        'Pengambilan belum dicatat, tidak bisa menerima pembayaran',
      );
    }

    // Race condition guard: kunci baris record (SELECT ... FOR UPDATE) lalu
    // hitung ulang sisa DI DALAM transaksi, sehingga dua pembayaran paralel
    // tidak bisa sama-sama melewati sisa tagihan (overpayment).
    const payment = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "pickup_records" WHERE id = ${record.id} FOR UPDATE`;

      const fresh = await tx.pickupRecord.findUniqueOrThrow({
        where: { id: record.id },
      });
      const paidAgg = await tx.payment.aggregate({
        where: { recordId: fresh.id, voidedAt: null },
        _sum: { amount: true },
      });
      const remaining = fresh.feeAmount - (paidAgg._sum.amount ?? 0);
      if (remaining <= 0) {
        throw new BadRequestException('Catatan ini sudah lunas');
      }

      // Uang yang diterima dibatasi sebesar sisa catatan.
      const amount = Math.min(dto.amount, remaining);

      const created = await tx.payment.create({
        data: {
          recordId: fresh.id,
          receivedBy,
          amount,
          paidAt: new Date(),
          note: dto.note,
        },
      });
      const updated = await this.recalcPaymentStatus(fresh.id, tx);

      return { created, clamped: dto.amount > remaining, record: updated };
    });

    return {
      payment: {
        ...payment.created,
        requestedAmount: dto.amount,
        clamped: payment.clamped,
      },
      record: payment.record,
      remaining: await this.remainingOf(
        payment.created.recordId,
        payment.record.feeAmount,
      ),
      kasbonLimit: await this.getKasbonLimitValue(),
    };
  }

  /**
   * Batalkan pembayaran (append-only design: pembayaran di-void, bukan dihapus).
   */
  async voidPayment(paymentId: string, receivedBy: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { record: true },
    });
    if (!payment) {
      throw new NotFoundException('Pembayaran tidak ditemukan');
    }
    if (payment.receivedBy !== receivedBy) {
      throw new ForbiddenException('Pembayaran ini bukan diterima oleh Anda');
    }
    if (payment.voidedAt) {
      throw new BadRequestException('Pembayaran sudah dibatalkan');
    }

    const voided = await this.prisma.$transaction(async (tx) => {
      // Race condition: kunci baris record agar void berbarengan addPayment
      // tetap menghasilkan payment_status yang benar (recalc berurutan).
      await tx.$queryRaw`SELECT id FROM "pickup_records" WHERE id = ${payment.recordId} FOR UPDATE`;
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: { voidedAt: new Date() },
      });
      await this.recalcPaymentStatus(payment.recordId, tx);
      return updated;
    });

    const updatedRecord = await this.prisma.pickupRecord.findUnique({
      where: { id: payment.recordId },
    });

    return { payment: voided, record: updatedRecord };
  }

  /**
   * F13 — Rincian kasbon rumah: catatan yang sudah diambil dengan sisa > 0.
   * Hanya petugas pemilik rumah atau admin yang boleh melihatnya (anti-IDOR).
   */
  async getOutstanding(houseId: string, user: AuthenticatedUser) {
    const house = await this.prisma.house.findFirst({
      where: { id: houseId, deletedAt: null },
    });
    if (!house) {
      throw new NotFoundException('Rumah tidak ditemukan');
    }

    const isOwner = house.collectorId === user.id;
    const isAdmin = user.roles.includes('admin');
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Anda tidak berhak melihat kasbon rumah milik petugas lain',
      );
    }

    const records = await this.prisma.pickupRecord.findMany({
      where: { houseId, pickupStatus: 'sudah_diambil' },
      include: {
        payments: { where: { voidedAt: null }, select: { amount: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return records
      .map((record) => {
        const paid = record.payments.reduce((sum, p) => sum + p.amount, 0);
        return {
          id: record.id,
          houseId: record.houseId,
          collectorId: record.collectorId,
          dueDate: record.dueDate,
          pickedAt: record.pickedAt,
          bagsCount: record.bagsCount,
          feeAmount: record.feeAmount,
          paid,
          sisa: record.feeAmount - paid,
          paymentStatus: record.paymentStatus,
        };
      })
      .filter((record) => record.sisa > 0);
  }

  private async recalcPaymentStatus(
    recordId: string,
    tx: Prisma.TransactionClient,
  ) {
    const record = await tx.pickupRecord.findUniqueOrThrow({
      where: { id: recordId },
      include: {
        payments: { where: { voidedAt: null }, select: { amount: true } },
      },
    });
    const activePaid = record.payments.reduce((sum, p) => sum + p.amount, 0);
    const paymentStatus = this.computePaymentStatus(
      record.feeAmount,
      activePaid,
    );
    return tx.pickupRecord.update({
      where: { id: recordId },
      data: { paymentStatus },
    });
  }

  private computePaymentStatus(feeAmount: number, activePaid: number): string {
    if (activePaid <= 0) return 'belum_bayar';
    if (activePaid >= feeAmount) return 'lunas';
    return 'sebagian';
  }

  private remainingOf(recordId: string, feeAmount: number) {
    return this.prisma.payment
      .aggregate({
        where: { recordId, voidedAt: null },
        _sum: { amount: true },
      })
      .then((paid) => Math.max(0, feeAmount - (paid._sum.amount ?? 0)));
  }

  private async getKasbonLimitValue(): Promise<number | null> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: KASBON_LIMIT_KEY },
    });
    return setting ? Number(setting.value) : null;
  }
}
