import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module'
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  
  const logger = new Logger('Bootstrap');
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Inventory Service API')
    .setDescription('Sistema de inventário distribuído com controle de versão e idempotência')
    .setVersion('1.0')
    .addTag('eventos', 'Endpoints para receber eventos de ajuste de estoque')
    .addTag('inventory', 'Endpoints para consultar inventário')
    .addTag('health', 'Endpoints de saúde do sistema')
    .addTag('metrics', 'Métricas Prometheus do sistema')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
  
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api`);
}
bootstrap();
