import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryResponseDto {
  @ApiProperty({
    description: 'SKU do produto consultado',
    example: 'PROD_ABC123',
    type: String
  })
  sku!: string;

  @ApiProperty({
    description: 'Quantidade total do produto em todas as lojas',
    example: 150,
    type: Number
  })
  totalQuantity!: number;

  @ApiPropertyOptional({
    description: 'Detalhes do inventário por loja (quando includeStores=true)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        storeId: { type: 'string', example: 'store_001' },
        quantity: { type: 'number', example: 50 },
        version: { type: 'number', example: 3 },
        updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  perStore?: Array<{
    storeId: string;
    quantity: number;
    version: number;
    updatedAt: Date;
  }>;
} 