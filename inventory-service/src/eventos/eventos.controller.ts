import { Controller, Post, Body } from '@nestjs/common';
import { EventosService } from './eventos.service';
import { StockAdjustedEventDto } from './dto/stock-adjusted.dto';
import { StockAdjustedResponseDto } from './dto/stock-adjusted-response.dto';

@Controller('v1/events')
export class EventosController {
  constructor(private readonly service: EventosService) {}

  @Post('stock-adjusted')
  receberAjusteEstoque(@Body() dto: StockAdjustedEventDto): Promise<StockAdjustedResponseDto> {
    return this.service.receberAjusteEstoque(dto);
  }
}
