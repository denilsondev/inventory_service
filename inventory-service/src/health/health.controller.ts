import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async obterSaude() {
    await this.prisma.$queryRawUnsafe('SELECT 1');
    return { status: 'ok', database: 'ok' };
  }
}
