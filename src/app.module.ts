import { Module } from '@nestjs/common';
import { EventosModule } from './eventos/eventos.module';
import { PrismaModule } from './prisma/prisma.module';
import { EstoqueModule } from './estoque/estoque.module';
import { MetricsModule } from './metrics/metricas.module';
import { HealthModule } from './health/health.module';


@Module({
  imports: [EventosModule, PrismaModule, EstoqueModule, MetricsModule, HealthModule],
})
export class AppModule {}
