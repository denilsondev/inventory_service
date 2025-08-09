import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

@Module({
  imports: [],
  controllers: [AppController, HealthController],
  providers: [AppService, { provide: PrismaClient, useValue: prisma }],
})
export class AppModule {}
