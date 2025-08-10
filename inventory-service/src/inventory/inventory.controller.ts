import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryResponseDto } from './dto/inventory-response.dto';

@ApiTags('inventory')
@Controller('v1/inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get(':sku')
  @ApiOperation({
    summary: 'Consultar inventário por SKU',
    description: 'Consulta o inventário de um produto específico, podendo incluir detalhes por loja'
  })
  @ApiParam({
    name: 'sku',
    description: 'SKU do produto a ser consultado',
    example: 'PROD_ABC123'
  })
  @ApiQuery({
    name: 'storeId',
    description: 'ID da loja específica (opcional)',
    required: false,
    example: 'store_001'
  })
  @ApiQuery({
    name: 'includeStores',
    description: 'Incluir detalhes por loja na resposta',
    required: false,
    example: 'true'
  })
  @ApiResponse({
    status: 200,
    description: 'Inventário consultado com sucesso',
    type: InventoryResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'SKU não encontrado'
  })
  consultarInventario(
    @Param('sku') sku: string,
    @Query('storeId') storeId?: string,
    @Query('includeStores') includeStores?: string
  ): Promise<InventoryResponseDto> {
    const shouldIncludeStores = includeStores === 'true';
    return this.service.consultarInventario(sku, storeId, shouldIncludeStores);
  }
} 