import { Injectable } from '@nestjs/common';
import { PerStoreInventory, PrismaClient } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByStoreAndSku(storeId: string, sku: string): Promise<PerStoreInventory | null> {
    return this.prisma.perStoreInventory.findUnique({
      where: {
        storeId_sku: { storeId, sku }
      }
    });
  }

    async findBySku(sku: string): Promise<PerStoreInventory[]> {
    return this.prisma.perStoreInventory.findMany({
      where: { sku },
      orderBy: { storeId: 'asc' }
    });
  }



  async upsertInventory(data: {
    storeId: string;
    sku: string;
    quantity: number;
    version: number;
  }): Promise<PerStoreInventory> {
    return this.prisma.perStoreInventory.upsert({
      where: {
        storeId_sku: { storeId: data.storeId, sku: data.sku }
      },
      update: {
        quantity: data.quantity,
        version: data.version,
        updatedAt: new Date()
      },
      create: {
        storeId: data.storeId,
        sku: data.sku,
        quantity: data.quantity,
        version: data.version
      }
    });
  }

  async upsertInventoryInTransaction(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>, data: {
    storeId: string;
    sku: string;
    quantity: number;
    version: number;
  }): Promise<PerStoreInventory> {
    return tx.perStoreInventory.upsert({
      where: {
        storeId_sku: { storeId: data.storeId, sku: data.sku }
      },
      update: {
        quantity: data.quantity,
        version: data.version,
        updatedAt: new Date()
      },
      create: {
        storeId: data.storeId,
        sku: data.sku,
        quantity: data.quantity,
        version: data.version
      }
    });
  }
} 