import { Controller, Get } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaClient) {}

  @Get()
  async obterSaude() {
    await this.prisma.$queryRawUnsafe('SELECT 1');
    return { status: 'ok', database: 'ok' };
  }
}
