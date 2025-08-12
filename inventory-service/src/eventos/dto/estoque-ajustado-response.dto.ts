export class EstoqueAjustadoResponseDto {
  
  aplicado!: boolean;

  status!: 'aplicado' | 'evento_duplicado' | 'versao_desatualizada' | 'gap_detectado' | 'gap_detectado_warning' | 'gap_critico';

  versaoAtual!: number;

  quantidadeAtual!: number;
} 