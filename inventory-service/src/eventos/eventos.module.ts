import { Module } from '@nestjs/common';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { EventRepository } from './repository/event.repository';


@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [EventosController],
  providers: [EventosService, EventRepository]
})
export class EventosModule {}
