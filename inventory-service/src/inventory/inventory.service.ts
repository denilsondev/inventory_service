import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryResponseDto } from 'src/inventory/dto/inventory-response.dto';
import { InventoryRepository } from 'src/inventory/inventory.repository';


@Injectable()
export class InventoryService {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async consultarInventario(storeId: string, sku: string): Promise<InventoryResponseDto> {
    const inventory = await this.inventoryRepository.findByStoreAndSku(storeId, sku);
    
    if (!inventory) {
      throw new NotFoundException(`Inventario nao encontrado da loja ${storeId} e SKU ${sku}`);
    }

    return {
      storeId: inventory.storeId,
      sku: inventory.sku,
      quantity: inventory.quantity,
      version: inventory.version,
      updatedAt: inventory.updatedAt
    };
  }
} 