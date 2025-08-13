import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EstoqueService } from './estoque.service';
import { EstoqueResponseDto } from './dto/estoque-response.dto';

@ApiTags('estoque')
@Controller('v1/estoque')
export class EstoqueController {
  constructor(private readonly service: EstoqueService) {}

  @Get(':sku')
  @ApiOperation({ summary: 'Consultar inventário por SKU' })


  consultarInventario(
    @Param('sku') sku: string,
    @Query('storeId') storeId?: string,
    @Query('includeStores') includeStores?: string
  ): Promise<EstoqueResponseDto> {

    const shouldIncludeStores = includeStores === 'true';
    return this.service.consultarInventario(sku, storeId, shouldIncludeStores);
    
  }
} 