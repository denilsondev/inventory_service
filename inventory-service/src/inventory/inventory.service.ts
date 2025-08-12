import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InventoryResponseDto } from './dto/inventory-response.dto';
import { InventarioPorLoja } from '@prisma/client';
import { InventoryRepository } from './inventory.repository';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async consultarInventario(
    sku: string, 
    storeId?: string, 
    includeStores: boolean = false
  ): Promise<InventoryResponseDto> {
    this.logger.log(`🔍 Consultando inventário para SKU ${sku}`, {
      sku,
      storeId,
      includeStores
    });

    try {
      let inventories: InventarioPorLoja[];
      
      if (storeId) {
        // Consulta específica por loja
        const inventory = await this.inventoryRepository.findByStoreAndSku(storeId, sku);
        if (!inventory) {
          this.logger.warn(`Inventário não encontrado para store ${storeId} e SKU ${sku}`);
          throw new NotFoundException(`Inventory not found for store ${storeId} and SKU ${sku}`);
        }
        inventories = [inventory];
      } else {
        // Consulta por SKU em todas as lojas
        inventories = await this.inventoryRepository.findBySku(sku);
        if (inventories.length === 0) {
          this.logger.warn(`Nenhum inventário encontrado para SKU ${sku}`);
          throw new NotFoundException(`No inventory found for SKU ${sku}`);
        }
      }

      // Calcular total 
      const totalQuantity = inventories.reduce((sum, inv) => sum + inv.quantidade, 0);

      // Preparar resposta
      const response = new InventoryResponseDto();
      response.sku = sku;
      response.totalQuantity = totalQuantity;
      
      if (includeStores) {
        response.perStore = inventories.map((inv: InventarioPorLoja) => ({
          storeId: inv.idLoja,
          quantity: inv.quantidade,
          version: inv.versao,
          updatedAt: inv.atualizadoEm
        }));
      }

      this.logger.log(`Inventário consultado com sucesso para SKU ${sku}`, {
        sku,
        totalQuantity,
        storeCount: inventories.length,
        includeStores
      });

      return response;
    } catch (error) {
      this.logger.error(`Erro ao consultar inventário para SKU ${sku}`, {
        sku,
        storeId,
        error: error.message
      });
      throw error;
    }
  }
} 