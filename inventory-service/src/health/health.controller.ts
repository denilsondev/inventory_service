import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Verificar saúde do sistema',
    description: 'Verifica se o serviço e o banco de dados estão funcionando'
  })
  @ApiResponse({
    status: 200,
    description: 'Sistema saudável',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        database: { type: 'string', example: 'ok' }
      }
    }
  })
  async obterSaude() {
    await this.prisma.$queryRawUnsafe('SELECT 1');
    return { status: 'ok', database: 'ok' };
  }
}
