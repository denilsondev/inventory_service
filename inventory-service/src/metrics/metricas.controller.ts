import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MetricasService } from './metricas.service';

@ApiTags('metricas')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricasService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  async obterMetricas(): Promise<string> {
    return this.metricsService.obterMetricas();
  }
} 