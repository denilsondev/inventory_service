import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EstoqueService } from './estoque.service';
import { EstoqueResponseDto } from './dto/estoque-response.dto';

@ApiTags('estoque')
@Controller('v1/estoque')
export class EstoqueController {
  constructor(private readonly service: EstoqueService) {}

  @Get(':sku')
  @ApiOperation({ summary: 'Consultar estoque por SKU' })
  consultarInventario(
    @Param('sku') sku: string,
    @Query('idLoja') storeId?: string,
    @Query('lojasInclusas') includeStores?: string
  ): Promise<EstoqueResponseDto> {

    const shouldIncludeStores = includeStores === 'true';
    return this.service.consultarInventario(sku, storeId, shouldIncludeStores);

  }
} 