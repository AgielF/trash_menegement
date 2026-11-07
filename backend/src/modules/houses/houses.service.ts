import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { UpdateHouseDto } from './dto/update-house.dto';

@Injectable()
export class HousesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createHouseDto: CreateHouseDto,
    userId: string,
    isAdmin = false,
  ) {
    const collectorId = isAdmin ? createHouseDto.collectorId : userId;
    if (!collectorId) {
      throw new BadRequestException('Petugas wajib dipilih untuk rumah baru');
    }
    if (isAdmin) await this.ensureApprovedCollector(collectorId);

    const house = await this.prisma.house.create({
      data: {
        ownerName: createHouseDto.ownerName,
        rt: createHouseDto.rt,
        gang: createHouseDto.gang,
        addressNote: createHouseDto.addressNote,
        defaultFee: createHouseDto.defaultFee ?? 5000,
        intervalDays: createHouseDto.intervalDays ?? 7,
        nextDueDate: new Date(createHouseDto.nextDueDate),
        collectorId,
      },
    });
    return house;
  }

  /**
   * F9 — Edit rumah: data, jadwal, dan nominal default.
   *
   * Jika nominal default berubah: catatan yang belum diambil ikut diperbarui,
   * dan perubahan tercatat di riwayat (`HouseFeeHistory`).
   */
  async update(
    houseId: string,
    dto: UpdateHouseDto,
    userId: string,
    isAdmin = false,
  ) {
    if (dto.collectorId !== undefined && !isAdmin) {
      throw new ForbiddenException(
        'Hanya admin yang dapat mengubah petugas rumah',
      );
    }
    const house = await this.findOne(houseId, userId, isAdmin);
    if (dto.collectorId !== undefined) {
      await this.ensureApprovedCollector(dto.collectorId);
    }

    return this.prisma.$transaction(async (tx) => {
      const data: Prisma.HouseUncheckedUpdateInput = {};

      if (dto.ownerName !== undefined) data.ownerName = dto.ownerName;
      if (dto.rt !== undefined) data.rt = dto.rt;
      if (dto.gang !== undefined) data.gang = dto.gang;
      if (dto.addressNote !== undefined) data.addressNote = dto.addressNote;
      if (dto.intervalDays !== undefined) data.intervalDays = dto.intervalDays;
      if (dto.nextDueDate !== undefined) {
        data.nextDueDate = new Date(dto.nextDueDate);
      }
      if (dto.collectorId !== undefined) {
        data.collectorId = dto.collectorId;
        await tx.pickupRecord.updateMany({
          where: { houseId: house.id, pickupStatus: 'belum_diambil' },
          data: { collectorId: dto.collectorId },
        });
      }

      if (dto.defaultFee !== undefined && dto.defaultFee !== house.defaultFee) {
        data.defaultFee = dto.defaultFee;

        await tx.pickupRecord.updateMany({
          where: { houseId: house.id, pickupStatus: 'belum_diambil' },
          data: { feeAmount: dto.defaultFee },
        });

        await tx.houseFeeHistory.create({
          data: {
            houseId: house.id,
            oldFee: house.defaultFee,
            newFee: dto.defaultFee,
            changedBy: userId,
            changedAt: new Date(),
          },
        });
      }

      return tx.house.update({ where: { id: house.id }, data });
    });
  }

  /** Hapus rumah secara lembut: tidak hilang dari riwayat, tapi tidak aktif. */
  async softDelete(houseId: string, userId: string, isAdmin = false) {
    const house = await this.findOne(houseId, userId, isAdmin);

    return this.prisma.house.update({
      where: { id: house.id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async findMyHouses(collectorId: string) {
    return this.prisma.house.findMany({
      where: { collectorId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, collectorId: string, isAdmin = false) {
    const house = await this.prisma.house.findFirst({
      where: { id, ...(isAdmin ? {} : { collectorId }), deletedAt: null },
    });
    if (!house) {
      throw new NotFoundException('Rumah tidak ditemukan');
    }
    return house;
  }

  private async ensureApprovedCollector(collectorId: string): Promise<void> {
    const collector = await this.prisma.user.findFirst({
      where: {
        id: collectorId,
        status: 'approved',
        roles: { some: { role: { name: 'collector' } } },
      },
      select: { id: true },
    });
    if (!collector) {
      throw new BadRequestException(
        'Petugas tidak ditemukan atau belum disetujui',
      );
    }
  }
}
