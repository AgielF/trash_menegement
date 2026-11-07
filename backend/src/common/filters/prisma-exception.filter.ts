import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

interface PrismaErrorBody {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
}

/**
 * Filter global untuk error Prisma Client agar respons HTTP rapi:
 *
 * - P2002 (unique constraint)  → 409 Conflict
 * - P2025 (record not found)   → 404 Not Found
 * - P2003 (foreign key)        → 400 Bad Request
 * - kode lain                  → 500 Internal Server Error
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toErrorBody(exception);

    this.logger.warn(`Prisma error ${exception.code}: ${body.message}`);
    response.status(body.statusCode).json(body);
  }

  private toErrorBody(
    exception: Prisma.PrismaClientKnownRequestError,
  ): PrismaErrorBody {
    switch (exception.code) {
      case 'P2002':
        return this.body(
          HttpStatus.CONFLICT,
          'Data sudah ada (duplikat)',
          exception,
        );
      case 'P2025':
        return this.body(
          HttpStatus.NOT_FOUND,
          'Data tidak ditemukan',
          exception,
        );
      case 'P2003':
        return this.body(
          HttpStatus.BAD_REQUEST,
          'Relasi data tidak valid (data induk tidak ada)',
          exception,
        );
      default:
        return this.body(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Kesalahan database',
          exception,
        );
    }
  }

  private body(
    statusCode: HttpStatus,
    message: string,
    exception: Prisma.PrismaClientKnownRequestError,
  ): PrismaErrorBody {
    return {
      statusCode,
      message,
      error: `[${exception.code}] ${exception.message}`,
      timestamp: new Date().toISOString(),
    };
  }
}
