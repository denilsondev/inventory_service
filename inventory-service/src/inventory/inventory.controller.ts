import { Controller, Get, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryResponseDto } from './dto/inventory-response.dto';


@Controller('v1/inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get(':storeId/:sku')
  consultarInventario(
    @Param('storeId') storeId: string,
    @Param('sku') sku: string
  ): Promise<InventoryResponseDto> {
    return this.service.consultarInventario(storeId, sku);
  }
} 