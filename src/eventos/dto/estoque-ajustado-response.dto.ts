export class EstoqueAjustadoResponseDto {
  
  aplicado!: boolean;

  status!: 'aplicado' | 'evento_duplicado' | 'versao_desatualizada' | 'gap_detectado';

  versaoAtual!: number;

  quantidadeAtual!: number;
} 