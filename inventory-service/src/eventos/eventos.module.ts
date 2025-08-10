import { Module } from '@nestjs/common';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { MetricsModule } from '../metrics/metrics.module';
import { EventRepository } from './repository/event.repository';

@Module({
  imports: [PrismaModule, InventoryModule, MetricsModule],
  controllers: [EventosController],
  providers: [EventosService, EventRepository /* outros providers */],
})
export class EventosModule {}
