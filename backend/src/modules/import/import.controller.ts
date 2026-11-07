import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ImportService } from './import.service';
import { ConfirmImportDto } from './dto/confirm-import.dto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@UseGuards(JwtAuthGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('preview')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  preview(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File wajib diunggah (field "file")');
    }
    return this.importService.previewImport(file);
  }

  @Post('confirm')
  confirm(
    @Body() dto: ConfirmImportDto,
    @CurrentUser('id') uploadedBy: string,
  ) {
    return this.importService.confirmImport(dto, uploadedBy);
  }
}
