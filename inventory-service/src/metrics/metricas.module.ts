import { Module } from '@nestjs/common';
import { MetricasService } from './metricas.service';
import { MetricsController } from './metricas.controller';


@Module({
  providers: [MetricasService],
  controllers: [MetricsController],
  exports: [MetricasService],
})
export class MetricsModule {} 