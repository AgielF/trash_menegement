import { IsArray, IsOptional } from 'class-validator';

/** Item bebas dengan minimal `id`; field lain tergantung jenis entitas. */
export class SyncItem {
  @IsOptional()
  id?: string;

  [key: string]: unknown;
}

export class PushSyncPayloadDto {
  @IsArray()
  @IsOptional()
  houses?: SyncItem[];

  @IsArray()
  @IsOptional()
  pickups?: SyncItem[];

  @IsArray()
  @IsOptional()
  payments?: SyncItem[];
}
