import { IsInt, IsString, Min } from 'class-validator';

export class StockAdjustedEventDto {
  @IsString()
  eventId!: string;

  @IsString()
  storeId!: string;

  @IsString()
  sku!: string;

  @IsInt()
  @Min(0)
  quantity!: number;

  @IsInt()
  @Min(1)
  version!: number;
} 