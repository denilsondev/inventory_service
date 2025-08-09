import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  obterSaude() {
    return { status: 'ok' };
  }
}
