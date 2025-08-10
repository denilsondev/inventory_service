import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EventosService } from './eventos.service';
import { StockAdjustedEventDto } from './dto/stock-adjusted.dto';
import { StockAdjustedResponseDto } from './dto/stock-adjusted-response.dto';

@ApiTags('eventos')
@Controller('v1/events')
export class EventosController {
  constructor(private readonly service: EventosService) {}

  @Post('stock-adjusted')
  @ApiOperation({
    summary: 'Receber evento de ajuste de estoque',
    description: 'Recebe e processa eventos de ajuste de estoque com controle de idempotência e versão'
  })
  @ApiBody({
    type: StockAdjustedEventDto,
    description: 'Dados do evento de ajuste de estoque'
  })
  @ApiResponse({
    status: 202,
    description: 'Evento aplicado com sucesso',
    type: StockAdjustedResponseDto
  })
  @ApiResponse({
    status: 200,
    description: 'Evento não aplicado (duplicado, versão antiga ou gap detectado)',
    type: StockAdjustedResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou versão antiga'
  })
  @ApiResponse({
    status: 409,
    description: 'Evento duplicado'
  })
  receberAjusteEstoque(@Body() dto: StockAdjustedEventDto): Promise<StockAdjustedResponseDto> {
    return this.service.receberAjusteEstoque(dto);
  }
}
