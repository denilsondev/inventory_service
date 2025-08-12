import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EventosService } from './eventos.service';
import { EstoqueAjustadoEventoDto } from './dto/estoque-ajustado.dto';
import { EstoqueAjustadoResponseDto } from './dto/estoque-ajustado-response.dto';

@ApiTags('eventos')
@Controller('v1/events')
export class EventosController {
  constructor(private readonly service: EventosService) {}

  @Post('estoque-ajustado')
  @ApiOperation({ summary: 'Receber evento de ajuste de estoque' })
  receberAjusteEstoque(@Body() dto: EstoqueAjustadoEventoDto): Promise<EstoqueAjustadoResponseDto> {
    return this.service.receberAjusteEstoque(dto);
  }
}
