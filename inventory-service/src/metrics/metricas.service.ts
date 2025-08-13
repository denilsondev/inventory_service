import { Injectable } from '@nestjs/common';
import { register, Counter } from 'prom-client';

@Injectable()
export class MetricasService {
  private readonly eventosAplicadosTotal: Counter<string>;
  private readonly eventosIgnoradosTotal: Counter<string>;
  private readonly gapsDetectadosTotal: Counter<string>;

  constructor() {

    this.eventosAplicadosTotal = new Counter({
      name: 'eventos_aplicados_total',
      help: 'Total de eventos de estoque aplicados com sucesso',
    });

    // Contador de eventos ignorados por motivo
    this.eventosIgnoradosTotal = new Counter({
      name: 'eventos_ignorados_total',
      help: 'Total de eventos de estoque ignorados',
      labelNames: ['reason'],
    });


    this.gapsDetectadosTotal = new Counter({
      name: 'gaps_detectados_total',
      help: 'Total de gaps de versão detectados',
    });


    register.registerMetric(this.eventosAplicadosTotal);
    register.registerMetric(this.eventosIgnoradosTotal);
    register.registerMetric(this.gapsDetectadosTotal);
  }


  incrementaEventosAplicados(): void {
    this.eventosAplicadosTotal.inc();
  }


  incrementaEventosIgnorados(reason: 'duplicado' | 'desatualizado'): void {
    this.eventosIgnoradosTotal.inc({ reason });
  }


  incrementaGapsDetectados(): void {
    this.gapsDetectadosTotal.inc();
  }


  async obterMetricas(): Promise<string> {
    return register.metrics();
  }
} 