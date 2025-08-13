import { Injectable } from '@nestjs/common';
import { InventarioPorLoja, PrismaClient } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EstoqueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async obterPorLojaESku(idLoja: string, sku: string): Promise<InventarioPorLoja | null> {
    return this.prisma.inventarioPorLoja.findUnique({
      where: {
        idLoja_sku: { idLoja, sku }
      }
    });
  }

    async obterPorSku(sku: string): Promise<InventarioPorLoja[]> {
    return this.prisma.inventarioPorLoja.findMany({
      where: { sku },
      orderBy: { idLoja: 'asc' }
    });
  }



  async atualizarEstoque(data: {
    idLoja: string;
    sku: string;
    quantidade: number;
    versao: number;
  }): Promise<InventarioPorLoja> {
    return this.prisma.inventarioPorLoja.upsert({
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