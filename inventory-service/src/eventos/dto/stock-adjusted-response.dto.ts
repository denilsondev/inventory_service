export class StockAdjustedResponseDto {
  applied!: boolean;
  eventId!: string;
  previousQuantity!: number;
  newQuantity!: number;
  version!: number;
  storeId!: string;
  sku!: string;
} 