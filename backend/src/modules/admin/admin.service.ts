import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const KASBON_LIMIT_KEY = 'kasbon_limit_amount';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Cari satu user ber-role admin (fallback untuk identifikasi admin tanpa JWT). */
  private async findFirstAdminId(): Promise<string | null> {
    const admin = await this.prisma.user.findFirst({
      where: { roles: { some: { role: { name: 'admin' } } } },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    return admin?.id ?? null;
  }

  async getPendingUsers() {
    return this.prisma.user.findMany({
      where: { status: 'pending' },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        roles: { select: { role: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveUser(userId: string, adminId?: string) {
    return this.decideUser(userId, 'approved', adminId);
  }

  async rejectUser(userId: string, adminId?: string) {
    return this.decideUser(userId, 'rejected', adminId);
  }

  private async decideUser(
    userId: string,
    status: 'approved' | 'rejected',
    adminId?: string,
  ) {
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      throw new NotFoundException('User tidak ditemukan');
    }
    if (target.status !== 'pending') {
      throw new BadRequestException(`User sudah berstatus ${target.status}`);
    }

    const approverId = adminId ?? (await this.findFirstAdminId());
    if (!approverId) {
      throw new NotFoundException('Belum ada user ber-role admin');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status,
        approvedById: approverId,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        approvedById: true,
        approvedAt: true,
      },
    });
  }

  /**
   * F15 — Pindahkan rumah ke petugas lain.
   *
   * Rumah ganti pemilik, dan semua catatan yang masih terbuka
   * (`belum_diambil`) ikut pindah ke petugas tujuan. Catatan yang sudah
   * diambil tetap atas nama petugas saat itu.
   */
  async reassignHouse(houseId: string, newCollectorId: string) {
    const house = await this.prisma.house.findFirst({
      where: { id: houseId, deletedAt: null },
    });
    if (!house) {
      throw new NotFoundException('Rumah tidak ditemukan');
    }
    if (house.collectorId === newCollectorId) {
      throw new BadRequestException('Rumah sudah milik petugas tersebut');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: newCollectorId },
      include: { roles: { include: { role: true } } },
    });
    if (!target || target.status !== 'approved') {
      throw new BadRequestException('Petugas tujuan belum disetujui admin');
    }
    if (!target.roles.some((userRole) => userRole.role.name === 'collector')) {
      throw new BadRequestException('User tujuan bukan ber-role collector');
    }

    return this.prisma.$transaction(async (tx) => {
      const reassigned = await tx.house.update({
        where: { id: house.id },
        data: { collectorId: newCollectorId },
        include: {
          collector: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      await tx.pickupRecord.updateMany({
        where: { houseId: house.id, pickupStatus: 'belum_diambil' },
        data: { collectorId: newCollectorId },
      });

      return reassigned;
    });
  }

  /**
   * F16 — Baca pengaturan global.
   */
  async getSettings() {
    const settings = await this.prisma.setting.findMany({
      orderBy: { key: 'asc' },
    });
    const kasbonLimit = settings.find((s) => s.key === KASBON_LIMIT_KEY);

    return {
      kasbonLimit: kasbonLimit ? Number(kasbonLimit.value) : null,
      items: settings,
    };
  }

  /**
   * F16 — Ubah batas kasbon global (nominal rupiah, berlaku semua rumah).
   */
  async setKasbonLimit(value: number, adminId: string) {
    return this.prisma.setting.upsert({
      where: { key: KASBON_LIMIT_KEY },
      create: {
        key: KASBON_LIMIT_KEY,
        value: String(value),
        updatedBy: adminId,
      },
      update: { value: String(value), updatedBy: adminId },
    });
  }
}
