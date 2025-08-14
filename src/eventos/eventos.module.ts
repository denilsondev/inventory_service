import { Module } from '@nestjs/common';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EstoqueModule } from '../estoque/estoque.module';
import { MetricsModule } from '../metrics/metricas.module';
import { EventRepository } from './event.repository';

@Module({
  imports: [PrismaModule, EstoqueModule, MetricsModule],
  controllers: [EventosController],
  providers: [EventosService, EventRepository /* outros providers */],
})
export class EventosModule {}
