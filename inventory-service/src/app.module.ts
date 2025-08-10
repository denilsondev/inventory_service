import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventosModule } from './eventos/eventos.module';
import { PrismaModule } from './prisma/prisma.module';
import { InventoryModule } from './inventory/inventory.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [EventosModule, PrismaModule, InventoryModule, MetricsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
