import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { EventosService } from './eventos.service';
import { EstoqueAjustadoEventoDto } from './dto/estoque-ajustado.dto';
import { EstoqueAjustadoResponseDto } from './dto/estoque-ajustado-response.dto';

@ApiTags('eventos')
@Controller('v1/eventos')
export class EventosController {
  constructor(private readonly service: EventosService) {}

  @Post('estoque-ajustado')
  @ApiOperation({ 
    summary: 'Receber evento de ajuste de estoque',
    description: 'Processa eventos de ajuste de estoque com controle de idempotência e versão'
  })
  @ApiBody({
    type: EstoqueAjustadoEventoDto,
    description: 'Dados do evento de ajuste de estoque',
    examples: {
      reposicao: {
        summary: 'Exemplo de reposição',
        description: 'Evento de reposição que aumenta o estoque em 10 unidades',
        value: {
          idEvento: 'evt_1234567890_abc123',
          idLoja: 'loja_001',
          sku: 'PROD_ABC123',
          delta: 10,
          versao: 1,
          dataAtualizacao: '2024-01-15T10:30:00Z'
        }
      },
      venda: {
        summary: 'Exemplo de venda',
        description: 'Evento de venda que diminui o estoque em 2 unidades',
        value: {
          idEvento: 'evt_1234567890_def456',
          idLoja: 'loja_001',
          sku: 'PROD_ABC123',
          delta: -2,
          versao: 2,
          dataAtualizacao: '2024-01-15T11:00:00Z'
        }
      }
    }
  })
  receberAjusteEstoque(@Body() dto: EstoqueAjustadoEventoDto): Promise<EstoqueAjustadoResponseDto> {
    return this.service.receberAjusteEstoque(dto);
  }
}
