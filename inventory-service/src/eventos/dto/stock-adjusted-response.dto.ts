import { ApiProperty } from '@nestjs/swagger';

export class StockAdjustedResponseDto {
  @ApiProperty({
    description: 'Indica se o evento foi aplicado com sucesso',
    example: true,
    type: Boolean
  })
  applied!: boolean;

  @ApiProperty({
    description: 'Status do processamento do evento',
    example: 'applied',
    enum: ['applied', 'duplicate_event', 'stale_version', 'gap_detected'],
    type: String
  })
  status!: 'applied' | 'duplicate_event' | 'stale_version' | 'gap_detected';

  @ApiProperty({
    description: 'Versão atual do inventário após o processamento',
    example: 5,
    type: Number
  })
  currentVersion!: number;

  @ApiProperty({
    description: 'Quantidade atual do inventário após o processamento',
    example: 42,
    type: Number
  })
  currentQuantity!: number;
} 