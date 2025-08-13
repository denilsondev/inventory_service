import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EstoqueService } from './estoque.service';
import { EstoqueRepository } from './estoque.repository';
import { EstoqueController } from './estoque.controller';


@Module({
  imports: [PrismaModule],
  controllers: [EstoqueController],
  providers: [EstoqueService, EstoqueRepository],
  exports: [EstoqueRepository]
})
export class EstoqueModule {} 