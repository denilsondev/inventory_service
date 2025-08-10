import { IsInt, IsString, Min, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockAdjustedEventDto {
  @ApiProperty({
    description: 'ID único do evento para controle de idempotência',
    example: 'evt_123456789',
    type: String
  })
  @IsString()
  eventId!: string;

  @ApiProperty({
    description: 'ID da loja onde ocorreu o ajuste de estoque',
    example: 'store_001',
    type: String
  })
  @IsString()
  storeId!: string;

  @ApiProperty({
    description: 'SKU do produto (código de identificação)',
    example: 'PROD_ABC123',
    type: String
  })
  @IsString()
  sku!: string;

  @ApiProperty({
    description: 'Quantidade relativa do ajuste (negativo para vendas, positivo para reposição)',
    example: -1,
    type: Number,
    examples: [-1, 5, -10]
  })
  @IsInt()
  delta!: number; // Quantidade relativa (pode ser negativa para vendas)

  @ApiProperty({
    description: 'Versão do evento para controle de ordenação',
    example: 1,
    type: Number,
    minimum: 1
  })
  @IsInt()
  @Min(1)
  version!: number;

  @ApiPropertyOptional({
    description: 'Timestamp opcional do evento (ISO 8601)',
    example: '2024-01-15T10:30:00Z',
    type: String
  })
  @IsOptional()
  @IsDateString()
  occurredAt?: string; // Timestamp opcional do evento
} 