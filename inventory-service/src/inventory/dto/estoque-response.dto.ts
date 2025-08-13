export class EstoqueResponseDto {


  sku!: string;
  quantidadeTotal!: number;
  porLoja?: Array<{
    idLoja: string;
    quantidade: number;
    versao: number;
    atualizadoEm: Date;
  }>;
} 