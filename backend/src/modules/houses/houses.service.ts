import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { UpdateHouseDto } from './dto/update-house.dto';

@Injectable()
export class HousesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createHouseDto: CreateHouseDto, collectorId: string) {
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
  async update(houseId: string, dto: UpdateHouseDto, userId: string) {
    const house = await this.findOne(houseId, userId);

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
  async softDelete(houseId: string, userId: string) {
    const house = await this.findOne(houseId, userId);

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

  async findOne(id: string, collectorId: string) {
    const house = await this.prisma.house.findFirst({
      where: { id, collectorId, deletedAt: null },
    });
    if (!house) {
      throw new NotFoundException('Rumah tidak ditemukan');
    }
    return house;
  }
}
