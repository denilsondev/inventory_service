import { Test, TestingModule } from '@nestjs/testing';
import { EventosService } from './eventos.service';
import { EstoqueRepository } from '../estoque/estoque.repository';
import { EventRepository } from './event.repository';
import { PrismaService } from '../prisma/prisma.service';
import { MetricasService } from '../metrics/metricas.service';
import { EstoqueAjustadoEventoDto } from './dto/estoque-ajustado.dto';
import { BadRequestException } from '@nestjs/common';

describe('EventosService', () => {
  let service: EventosService;
  let estoqueRepository: jest.Mocked<EstoqueRepository>;
  let eventRepository: jest.Mocked<EventRepository>;
  let prismaService: jest.Mocked<PrismaService>;
  let metricasService: jest.Mocked<MetricasService>;

  const mockEventoDto: EstoqueAjustadoEventoDto = {
    idEvento: 'evt_teste_001',
    idLoja: 'loja_001',
    sku: 'PROD_TESTE',
    delta: 10,
    versao: 1,
    dataAtualizacao: '2024-01-15T10:30:00Z'
  };

  const mockEstoque = {
    idLoja: 'loja_001',
    sku: 'PROD_TESTE',
    quantidade: 10,
    versao: 1,
    atualizadoEm: new Date()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventosService,
        {
          provide: EstoqueRepository,
          useValue: {
            obterPorLojaESku: jest.fn(),
            obterPorSku: jest.fn(),
          },
        },
        {
          provide: EventRepository,
          useValue: {
            findByEventId: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
          },
        },
        {
          provide: MetricasService,
          useValue: {
            incrementaEventosAplicados: jest.fn(),
            incrementaEventosIgnorados: jest.fn(),
            incrementaGapsDetectados: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventosService>(EventosService);
    estoqueRepository = module.get(EstoqueRepository);
    eventRepository = module.get(EventRepository);
    prismaService = module.get(PrismaService);
    metricasService = module.get(MetricasService);
  });

  describe('receberAjusteEstoque', () => {
    it('deve aplicar evento com sucesso quando estoque não existe', async () => {
      // Arrange
      eventRepository.findByEventId.mockResolvedValue(null);
      estoqueRepository.obterPorLojaESku.mockResolvedValue(null);
      
      prismaService.$transaction.mockImplementation(async (callback) => {
        const mockTransaction = {
          estoquePorLoja: {
            upsert: jest.fn().mockResolvedValue(mockEstoque),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findFirst: jest.fn(),
            findFirstOrThrow: jest.fn(),
            findUniqueOrThrow: jest.fn(),
            updateMany: jest.fn(),
            deleteMany: jest.fn(),
            aggregate: jest.fn(),
            count: jest.fn(),
            groupBy: jest.fn()
          },
          eventoProcessado: {
            create: jest.fn().mockResolvedValue({}),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findFirst: jest.fn(),
            findFirstOrThrow: jest.fn(),
            findUniqueOrThrow: jest.fn(),
            updateMany: jest.fn(),
            deleteMany: jest.fn(),
            aggregate: jest.fn(),
            count: jest.fn(),
            groupBy: jest.fn()
          }
        };
        return await callback(mockTransaction as any);
      });

      // Act
      const result = await service.receberAjusteEstoque(mockEventoDto);

      // Assert
      expect(result.aplicado).toBe(true);
      expect(result.status).toBe('aplicado');
      expect(result.versaoAtual).toBe(1);
      expect(result.quantidadeAtual).toBe(10);
      expect(metricasService.incrementaEventosAplicados).toHaveBeenCalled();
    });

    it('deve rejeitar evento duplicado', async () => {
      // Arrange
      eventRepository.findByEventId.mockResolvedValue({ idEvento: 'evt_teste_001', criadoEm: new Date() });
      estoqueRepository.obterPorLojaESku.mockResolvedValue(mockEstoque);

      // Act
      const result = await service.receberAjusteEstoque(mockEventoDto);

      // Assert
      expect(result.aplicado).toBe(false);
      expect(result.status).toBe('evento_duplicado');
      expect(metricasService.incrementaEventosIgnorados).toHaveBeenCalledWith('duplicado');
    });

    it('deve rejeitar evento com versão desatualizada', async () => {
      // Arrange
      const estoqueAtual = { ...mockEstoque, versao: 5 };
      eventRepository.findByEventId.mockResolvedValue(null);
      estoqueRepository.obterPorLojaESku.mockResolvedValue(estoqueAtual);

      const eventoDesatualizado = { ...mockEventoDto, versao: 3 };

      // Act
      const result = await service.receberAjusteEstoque(eventoDesatualizado);

      // Assert
      expect(result.aplicado).toBe(false);
      expect(result.status).toBe('versao_desatualizada');
      expect(metricasService.incrementaEventosIgnorados).toHaveBeenCalledWith('desatualizado');
    });

    it('deve detectar gap de versão', async () => {
      // Arrange
      const estoqueAtual = { ...mockEstoque, versao: 1 };
      eventRepository.findByEventId.mockResolvedValue(null);
      estoqueRepository.obterPorLojaESku.mockResolvedValue(estoqueAtual);
      
      const eventoComGap = { ...mockEventoDto, versao: 5 };

      prismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          estoquePorLoja: {
            upsert: jest.fn().mockResolvedValue({ ...mockEstoque, versao: 5 })
          },
          eventoProcessado: {
            create: jest.fn().mockResolvedValue({})
          }
        } as any);
      });

      // Act
      const result = await service.receberAjusteEstoque(eventoComGap);

      // Assert
      expect(result.aplicado).toBe(true);
      expect(result.status).toBe('gap_detectado');
      expect(metricasService.incrementaGapsDetectados).toHaveBeenCalled();
    });

    it('deve rejeitar evento que causaria estoque negativo', async () => {
      // Arrange
      const estoqueAtual = { ...mockEstoque, quantidade: 5 };
      eventRepository.findByEventId.mockResolvedValue(null);
      estoqueRepository.obterPorLojaESku.mockResolvedValue(estoqueAtual);
      
      const eventoNegativo = { ...mockEventoDto, delta: -10 };

      // Act & Assert
      await expect(service.receberAjusteEstoque(eventoNegativo))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('validações de negócio', () => {
    it('deve permitir estoque zero', async () => {
      // Arrange
      const estoqueAtual = { ...mockEstoque, quantidade: 5, versao: 1 };
      eventRepository.findByEventId.mockResolvedValue(null);
      estoqueRepository.obterPorLojaESku.mockResolvedValue(estoqueAtual);
      
      const eventoParaZero = { ...mockEventoDto, delta: -5, versao: 2 };

      prismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          estoquePorLoja: {
            upsert: jest.fn().mockResolvedValue({ ...mockEstoque, quantidade: 0, versao: 2 })
          },
          eventoProcessado: {
            create: jest.fn().mockResolvedValue({})
          }
        } as any);
      });

      // Act
      const result = await service.receberAjusteEstoque(eventoParaZero);

      // Assert
      expect(result.aplicado).toBe(true);
      expect(result.quantidadeAtual).toBe(0);
    });

    it('deve permitir estoque positivo após estoque zero', async () => {
      // Arrange
      const estoqueAtual = { ...mockEstoque, quantidade: 0, versao: 2 };
      eventRepository.findByEventId.mockResolvedValue(null);
      estoqueRepository.obterPorLojaESku.mockResolvedValue(estoqueAtual);
      
      const eventoReposicao = { ...mockEventoDto, delta: 10, versao: 3 };

      prismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          estoquePorLoja: {
            upsert: jest.fn().mockResolvedValue({ ...mockEstoque, quantidade: 10, versao: 3 })
          },
          eventoProcessado: {
            create: jest.fn().mockResolvedValue({})
          }
        } as any);
      });

      // Act
      const result = await service.receberAjusteEstoque(eventoReposicao);

      // Assert
      expect(result.aplicado).toBe(true);
      expect(result.quantidadeAtual).toBe(10);
    });
  });
}); 