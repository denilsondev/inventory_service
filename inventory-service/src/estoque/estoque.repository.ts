import { Injectable } from '@nestjs/common';
import { EstoquePorLoja } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EstoqueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async obterPorLojaESku(idLoja: string, sku: string): Promise<EstoquePorLoja | null> {
    return this.prisma.estoquePorLoja.findUnique({
      where: {
        idLoja_sku: { idLoja, sku }
      }
    });
  }

  async obterPorSku(sku: string): Promise<EstoquePorLoja[]> {
    return this.prisma.estoquePorLoja.findMany({
      where: { sku },
      orderBy: { idLoja: 'asc' }
    });
  }

  async atualizarEstoque(data: {
    idLoja: string;
    sku: string;
    quantidade: number;
    versao: number;
  }): Promise<EstoquePorLoja> {
    return this.prisma.estoquePorLoja.upsert({
      where: {
        idLoja_sku: { idLoja: data.idLoja, sku: data.sku }
      },
      update: {
        quantidade: data.quantidade,
        versao: data.versao,
        atualizadoEm: new Date()
      },
      create: {
        idLoja: data.idLoja,
        sku: data.sku,
        quantidade: data.quantidade,
        versao: data.versao
      }
    });
  }
} 