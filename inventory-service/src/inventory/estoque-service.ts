import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EstoqueResponseDto } from './dto/estoque-response.dto';
import { InventarioPorLoja } from '@prisma/client';
import { EstoqueRepository } from './estoque-repository';

@Injectable()
export class EstoqueService {
  private readonly logger = new Logger(EstoqueService.name);

  constructor(private readonly estoqueRepository: EstoqueRepository) {}

  async consultarInventario(
    sku: string, 
    idLoja?: string, 
    lojaIncluida: boolean = false
  ): Promise<EstoqueResponseDto> {
    
    this.logger.log(`Consultando estoque para SKU ${sku}`, { sku, idLoja, lojaIncluida });

    const estoques = await this.obterEstoques(sku, idLoja);
    const quantidadeTotal = estoques.reduce((sum, est) => sum + est.quantidade, 0);

    const response = this.construirResposta(sku, quantidadeTotal, estoques, lojaIncluida);

    this.logger.log(`Estoque consultado com sucesso para SKU ${sku}`, { sku, quantidadeTotal, quantidadeLojas: estoques.length });

    return response;
  }

  private async obterEstoques(sku: string, idLoja?: string): Promise<InventarioPorLoja[]> {
    if (idLoja) {
      const estoque = await this.estoqueRepository.obterPorLojaESku(idLoja, sku);
      if (!estoque) {
        throw new NotFoundException(`Estoque não encontrado para loja ${idLoja} e SKU ${sku}`);
      }
      return [estoque];
    }

    const estoques = await this.estoqueRepository.obterPorSku(sku);
    if (estoques.length === 0) {
      throw new NotFoundException(`Nenhum estoque encontrado para SKU ${sku}`);
    }
    return estoques;
  }

  private construirResposta(
    sku: string, 
    quantidadeTotal: number, 
    estoques: InventarioPorLoja[], 
    lojaIncluida: boolean
  ): EstoqueResponseDto {
    const response = new EstoqueResponseDto();
    response.sku = sku;
    response.quantidadeTotal = quantidadeTotal;
    
    if (lojaIncluida) {
      response.porLoja = estoques.map(estoque => ({
        idLoja: estoque.idLoja,
        quantidade: estoque.quantidade,
        versao: estoque.versao,
        atualizadoEm: estoque.atualizadoEm
      }));
    }

    return response;
  }
} 