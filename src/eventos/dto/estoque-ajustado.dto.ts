import { IsInt, IsString, Min, IsOptional, IsDateString } from 'class-validator';

export class EstoqueAjustadoEventoDto {
  
  @IsString()
  idEvento!: string;

  @IsString()
  idLoja!: string;

  @IsString()
  sku!: string;

  @IsInt()
  delta!: number;

  @IsInt()
  @Min(1)
  versao!: number;

  @IsOptional()
  @IsDateString()
  dataAtualizacao?: string;
} 