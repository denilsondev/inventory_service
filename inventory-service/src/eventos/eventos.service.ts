import { Injectable, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { StockAdjustedEventDto } from './dto/stock-adjusted.dto';
import { StockAdjustedResponseDto } from './dto/stock-adjusted-response.dto';

import { PrismaService } from '../prisma/prisma.service';
import { InventoryRepository } from 'src/inventory/inventory.repository';
import { EventRepository } from './repository/event.repository';
import { MetricsService } from 'src/metrics/metrics.service';

@Injectable()
export class EventosService {
  private readonly logger = new Logger(EventosService.name);

  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly eventRepository: EventRepository,
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService
  ) {}

  async receberAjusteEstoque(dto: StockAdjustedEventDto): Promise<StockAdjustedResponseDto> {
    this.logger.log(`Recebendo evento de ajuste de estoque: ${dto.eventId}`, {
      eventId: dto.eventId,
      storeId: dto.storeId,
      sku: dto.sku,
      delta: dto.delta,
      version: dto.version
    });

    try {
      // Verificar se evento já foi processado
      this.logger.debug(`Verificando se evento ${dto.eventId} já foi processado`);
      const existingEvent = await this.eventRepository.findByEventId(dto.eventId);
      if (existingEvent) {
        this.logger.warn(`Evento ${dto.eventId} já foi processado anteriormente`);

        this.metricsService.incrementEventsIgnored('duplicate');
        
        // Buscar inventário atual para retornar status
        const currentInventory = await this.inventoryRepository.findByStoreAndSku(dto.storeId, dto.sku);

        const response = new StockAdjustedResponseDto();
        response.applied = false;
        response.status = 'duplicate_event';
        response.currentVersion = currentInventory?.version ?? 0;
        response.currentQuantity = currentInventory?.quantity ?? 0;

        return response;
      }

      // Buscar inventário atual para comparar versões
      this.logger.debug(`Buscando inventário atual para store ${dto.storeId} e SKU ${dto.sku}`);
      const currentInventory = await this.inventoryRepository.findByStoreAndSku(dto.storeId, dto.sku);
      
      // Verificar se versão do evento é válida
      if (currentInventory && dto.version <= currentInventory.version) {
        this.logger.warn(`Versão do evento ${dto.version} não é válida. Versão atual: ${currentInventory.version}`);

        this.metricsService.incrementEventsIgnored('stale');
        
        const response = new StockAdjustedResponseDto();
        response.applied = false;
        response.status = 'stale_version';
        response.currentVersion = currentInventory.version;
        response.currentQuantity = currentInventory.quantity;

        return response;
      }

      // Detectar gap de versão (pulo de versão)
      let gapDetected = false;
      if (currentInventory && dto.version > currentInventory.version + 1) {
        gapDetected = true;
        this.logger.warn(`Gap de versão detectado! Versão atual: ${currentInventory.version}, Versão do evento: ${dto.version}`);
        this.metricsService.incrementGapDetected();
      }

      this.logger.log(`Validações passaram. Iniciando transação para evento ${dto.eventId}`);

      // Executar operações em transação para garantir atomicidade
      const updatedInventory = await this.prisma.$transaction(async (tx) => {
        this.logger.debug(`Executando transação para evento ${dto.eventId}`);

        // Calcular nova quantidade aplicando o delta
        const currentQuantity = currentInventory?.quantity ?? 0;
        const newQuantity = currentQuantity + dto.delta;

        // Aplicar ajuste no inventário usando o repository
        const inventory = await this.inventoryRepository.upsertInventoryInTransaction(tx, {
          storeId: dto.storeId,
          sku: dto.sku,
          quantity: newQuantity, // Nova quantidade calculada
          version: dto.version
        });

        // Marcar evento como processado usando o repository
        await this.eventRepository.markEventAsProcessedInTransaction(tx, dto.eventId);

        this.logger.debug(`Transação concluída com sucesso para evento ${dto.eventId}`);
        return inventory;
      });

      this.metricsService.incrementEventsApplied();

      const response = new StockAdjustedResponseDto();
      response.applied = true;
      response.status = gapDetected ? 'gap_detected' : 'applied';
      response.currentVersion = updatedInventory.version;
      response.currentQuantity = updatedInventory.quantity;

      this.logger.log(`Evento ${dto.eventId} processado com sucesso`, {
        eventId: dto.eventId,
        previousQuantity: currentInventory?.quantity ?? 0,
        newQuantity: updatedInventory.quantity,
        version: updatedInventory.version,
        gapDetected
      });

      return response;
    } catch (error) {
      this.logger.error(`Erro ao processar evento ${dto.eventId}`, {
        eventId: dto.eventId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
