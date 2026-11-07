import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 10;
const COLLECTOR_ROLE = 'collector';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existing) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, SALT_ROUNDS);

    const role = await this.prisma.role.findUnique({
      where: { name: COLLECTOR_ROLE },
    });
    const collectorRole =
      role ??
      (await this.prisma.role.create({ data: { name: COLLECTOR_ROLE } }));

    await this.prisma.user.create({
      data: {
        fullName: registerDto.fullName,
        email: registerDto.email,
        passwordHash,
        status: 'pending',
        roles: {
          create: [{ roleId: collectorRole.id }],
        },
      },
    });

    return { message: 'Registrasi berhasil, menunggu persetujuan admin.' };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        roles: { include: { role: true } },
      },
    });
    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const passwordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    if (user.status === 'pending') {
      throw new UnauthorizedException('Akun menunggu persetujuan admin');
    }
    if (user.status === 'rejected') {
      throw new UnauthorizedException('Pendaftaran ditolak');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((userRole) => userRole.role.name),
    };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        roles: user.roles.map((userRole) => userRole.role.name),
      },
    };
  }
}
