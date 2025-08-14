import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar saúde do sistema' })
  async getHealth() {
    await this.prisma.$queryRawUnsafe('SELECT 1');
    return { status: 'ok', database: 'ok' };
  }
}
