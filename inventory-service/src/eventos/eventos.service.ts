import { Injectable, Logger } from '@nestjs/common';
import { EstoqueAjustadoEventoDto } from './dto/estoque-ajustado.dto';
import { EstoqueAjustadoResponseDto } from './dto/estoque-ajustado-response.dto';
import { InventarioPorLoja } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { EstoqueRepository } from 'src/inventory/estoque-repository';
import { EventRepository } from './repository/event.repository';
import { MetricsService } from 'src/metrics/metrics.service';

@Injectable()
export class EventosService {
  private readonly logger = new Logger(EventosService.name);

  constructor(
    private readonly estoqueRepository: EstoqueRepository,
    private readonly eventRepository: EventRepository,
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService
  ) {}

  async receberAjusteEstoque(dto: EstoqueAjustadoEventoDto): Promise<EstoqueAjustadoResponseDto> {
    this.logger.log(`Recebendo evento de ajuste de estoque: ${dto.idEvento}`, dto);

    try {
      const eventoExistente = await this.eventRepository.findByEventId(dto.idEvento);
      if (eventoExistente) {
        return this.lancarEventoDuplicado(dto);
      }

      // Verificar se versão do evento é válida
      const estoqueAtual = await this.estoqueRepository.obterPorLojaESku(dto.idLoja, dto.sku);
      
      if (estoqueAtual && dto.versao <= estoqueAtual.versao) {
        return this.lancarVersaoDesatualizada(dto, estoqueAtual);
      }

      // Detectar gap de versão (pulo de versão)
      const gapDetected = this.detectarGap(dto, estoqueAtual);

      // Executar operações em transação para garantir atomicidade
      const estoqueAtualizado = await this.processarTransacao(dto, estoqueAtual);

      this.metricsService.incrementEventsApplied();

      return this.buildSuccessResponse(dto, estoqueAtualizado, gapDetected, estoqueAtual);
    } catch (error) {
      this.logger.error(`Erro ao processar evento ${dto.idEvento}`, {
        idEvento: dto.idEvento,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  private async lancarEventoDuplicado(dto: EstoqueAjustadoEventoDto): Promise<EstoqueAjustadoResponseDto> {
    this.logger.warn(`Evento ${dto.idEvento} já foi processado anteriormente`);

    this.metricsService.incrementaEventoIgnorado('duplicado');
    
    // Buscar inventário atual para retornar status
    const currentInventory = await this.estoqueRepository.obterPorLojaESku(dto.idLoja, dto.sku);

    return this.buildResponse(false, 'evento_duplicado', currentInventory);
  }

  private async lancarVersaoDesatualizada(dto: EstoqueAjustadoEventoDto, estoqueAtual: InventarioPorLoja): Promise<EstoqueAjustadoResponseDto> {
    this.logger.warn(`Versão do evento ${dto.versao} não é válida. Versão atual: ${estoqueAtual.versao}`);

    this.metricsService.incrementaEventoIgnorado('desatualizado');
    
    return this.buildResponse(false, 'versao_desatualizada', estoqueAtual);
  }

  private detectarGap(dto: EstoqueAjustadoEventoDto, estoqueAtual: InventarioPorLoja | null): boolean {
    if (estoqueAtual && dto.versao > estoqueAtual.versao + 1) {
      this.logger.warn(`Gap de versão detectado! Versão atual: ${estoqueAtual.versao}, Versão do evento: ${dto.versao}`);
      this.metricsService.incrementGapDetected();
      return true;
    }
    return false;
  }

  private buildResponse(aplicado: boolean, status: string, estoque: InventarioPorLoja | null): EstoqueAjustadoResponseDto {
    const response = new EstoqueAjustadoResponseDto();
    response.aplicado = aplicado;
    response.status = status as any;
    response.versaoAtual = estoque?.versao ?? 0;
    response.quantidadeAtual = estoque?.quantidade ?? 0;
    return response;
  }

  private async processarTransacao(dto: EstoqueAjustadoEventoDto, estoqueAtual: InventarioPorLoja | null): Promise<InventarioPorLoja> {
    return await this.prisma.$transaction(async (tx) => {
      // Calcular nova quantidade aplicando o delta
      const quantidadeAtual = estoqueAtual?.quantidade ?? 0;
      const quantidadeNova = quantidadeAtual + dto.delta;

      // Aplicar ajuste no inventário diretamente
      const inventory = await tx.inventarioPorLoja.upsert({
        where: {
          idLoja_sku: { idLoja: dto.idLoja, sku: dto.sku }
        },
        update: {
          quantidade: quantidadeNova,
          versao: dto.versao,
          atualizadoEm: new Date()
        },
        create: {
          idLoja: dto.idLoja,
          sku: dto.sku,
          quantidade: quantidadeNova,
          versao: dto.versao
        }
      });

      // Marcar evento como processado diretamente
      await tx.eventoProcessado.create({
        data: { idEvento: dto.idEvento }
      });

      return inventory;
    });
  }

  private buildSuccessResponse(
    dto: EstoqueAjustadoEventoDto, 
    updatedInventory: InventarioPorLoja, 
    gapDetected: boolean,
    estoqueAtual: InventarioPorLoja | null
  ): EstoqueAjustadoResponseDto {
    const response = this.buildResponse(true, gapDetected ? 'gap_detectado' : 'aplicado', updatedInventory);

    this.logger.log(`Evento ${dto.idEvento} processado com sucesso`, {
      idEvento: dto.idEvento,
      previousQuantity: estoqueAtual?.quantidade ?? 0,
      newQuantity: updatedInventory.quantidade,
      versao: updatedInventory.versao,
      gapDetected
    });

    return response;
  }
}
