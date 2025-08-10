import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { StockAdjustedEventDto } from './dto/stock-adjusted.dto';
import { InventoryRepository } from 'src/inventory/inventory.repository';
import { EventRepository } from './repository/event.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { StockAdjustedResponseDto } from './dto/stock-adjusted-response.dto';


@Injectable()
export class EventosService {
    constructor(
        private readonly inventoryRepository: InventoryRepository,
        private readonly eventRepository: EventRepository,
        private readonly prisma: PrismaService
    ) { }

    async receberAjusteEstoque(dto: StockAdjustedEventDto): Promise<StockAdjustedResponseDto> {
        // Verificar se evento já foi processado
        const existingEvent = await this.eventRepository.findByEventId(dto.eventId);
        if (existingEvent) {
            throw new ConflictException(`Event ${dto.eventId} already processed`);
        }

        // Buscar inventário atual para comparar versões
        const currentInventory = await this.inventoryRepository.findByStoreAndSku(dto.storeId, dto.sku);

        // Verificar se versão do evento é válida
        if (currentInventory && dto.version <= currentInventory.version) {
            throw new BadRequestException(
                `Event version ${dto.version} must be greater than current version ${currentInventory.version}`
            );
        }

        // Executar operações em transação para garantir atomicidade
        const updatedInventory = await this.prisma.$transaction(async (tx) => {
            // Aplicar ajuste no inventário usando o repository
            const inventory = await this.inventoryRepository.upsertInventoryInTransaction(tx, {
                storeId: dto.storeId,
                sku: dto.sku,
                quantity: dto.quantity,
                version: dto.version
            });

            // Marcar evento como processado usando o repository
            await this.eventRepository.markEventAsProcessedInTransaction(tx, dto.eventId);

            return inventory;
        });


        const response = new StockAdjustedResponseDto();
        response.applied = true;
        response.eventId = dto.eventId;
        response.previousQuantity = currentInventory?.quantity ?? 0;
        response.newQuantity = updatedInventory.quantity;
        response.version = updatedInventory.version;
        response.storeId = updatedInventory.storeId;
        response.sku = updatedInventory.sku;

        return response;
    }
}
