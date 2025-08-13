import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EstoqueAjustadoEventoDto } from './dto/estoque-ajustado.dto';
import { EstoqueAjustadoResponseDto } from './dto/estoque-ajustado-response.dto';
import { EstoquePorLoja } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventRepository } from './event.repository';
import { MetricasService } from 'src/metrics/metricas.service';
import { EstoqueRepository } from 'src/estoque/estoque.repository';


@Injectable()
export class EventosService {
  private readonly logger = new Logger(EventosService.name);

  constructor(
    private readonly estoqueRepository: EstoqueRepository,
    private readonly eventRepository: EventRepository,
    private readonly prisma: PrismaService,
    private readonly metricasService: MetricasService
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

      this.metricasService.incrementaEventosAplicados();

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

    this.metricasService.incrementaEventosIgnorados('duplicado');
    
    // Buscar inventário atual para retornar status
    const currentInventory = await this.estoqueRepository.obterPorLojaESku(dto.idLoja, dto.sku);

    return this.buildResponse(false, 'evento_duplicado', currentInventory);
  }

  private async lancarVersaoDesatualizada(dto: EstoqueAjustadoEventoDto, estoqueAtual: EstoquePorLoja): Promise<EstoqueAjustadoResponseDto> {
    this.logger.warn(`Versão do evento ${dto.versao} não é válida. Versão atual: ${estoqueAtual.versao}`);

    this.metricasService.incrementaEventosIgnorados('desatualizado');
    
    return this.buildResponse(false, 'versao_desatualizada', estoqueAtual);
  }

  private detectarGap(dto: EstoqueAjustadoEventoDto, estoqueAtual: EstoquePorLoja | null): boolean {
    if (estoqueAtual && dto.versao > estoqueAtual.versao + 1) {
      this.logger.warn(`Gap de versão detectado! Versão atual: ${estoqueAtual.versao}, Versão do evento: ${dto.versao}`);
      this.metricasService.incrementaGapsDetectados();
      return true;
    }
    return false;
  }

  private buildResponse(aplicado: boolean, status: string, estoque: EstoquePorLoja | null): EstoqueAjustadoResponseDto {
    const response = new EstoqueAjustadoResponseDto();
    response.aplicado = aplicado;
    response.status = status as any;
    response.versaoAtual = estoque?.versao ?? 0;
    response.quantidadeAtual = estoque?.quantidade ?? 0;
    return response;
  }

  private async processarTransacao(dto: EstoqueAjustadoEventoDto, estoqueAtual: EstoquePorLoja | null): Promise<EstoquePorLoja> {
    return await this.prisma.$transaction(async (tx) => {
      // Calcular nova quantidade aplicando o delta
      const quantidadeAtual = estoqueAtual?.quantidade ?? 0;
      const quantidadeNova = quantidadeAtual + dto.delta;

      // Validar se o estoque não ficará negativo
      if (quantidadeNova < 0) {
        throw new BadRequestException(`Estoque não pode ficar negativo. Quantidade atual: ${quantidadeAtual}, Delta: ${dto.delta}, Resultado: ${quantidadeNova}`);
      }

      // Aplicar ajuste no inventário diretamente
      const estoque = await tx.estoquePorLoja.upsert({
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

      return estoque;
    });
  }

  private buildSuccessResponse(
    dto: EstoqueAjustadoEventoDto, 
    estoqueAtualizado: EstoquePorLoja, 
    gapDetected: boolean,
    estoqueAtual: EstoquePorLoja | null
  ): EstoqueAjustadoResponseDto {
    const response = this.buildResponse(true, gapDetected ? 'gap_detectado' : 'aplicado', estoqueAtualizado);

    this.logger.log(`Evento ${dto.idEvento} processado com sucesso`, {
      idEvento: dto.idEvento,
      previousQuantity: estoqueAtual?.quantidade ?? 0,
      newQuantity: estoqueAtualizado.quantidade,
      versao: estoqueAtualizado.versao,
      gapDetected
    });

    return response;
  }
}
