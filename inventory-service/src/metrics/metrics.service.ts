import { Injectable } from '@nestjs/common';
import { register, Counter, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly eventsAppliedTotal: Counter<string>;
  private readonly eventsIgnoredTotal: Counter<string>;
  private readonly gapDetectedTotal: Counter<string>;

  constructor() {
    // Contador de eventos aplicados com sucesso
    this.eventsAppliedTotal = new Counter({
      name: 'events_applied_total',
      help: 'Total de eventos de estoque aplicados com sucesso',
    });

    // Contador de eventos ignorados por motivo
    this.eventsIgnoredTotal = new Counter({
      name: 'events_ignored_total',
      help: 'Total de eventos de estoque ignorados',
      labelNames: ['reason'],
    });

    // Contador de gaps de versão detectados
    this.gapDetectedTotal = new Counter({
      name: 'gap_detected_total',
      help: 'Total de gaps de versão detectados',
    });

    // Registrar métricas no registro global do Prometheus
    register.registerMetric(this.eventsAppliedTotal);
    register.registerMetric(this.eventsIgnoredTotal);
    register.registerMetric(this.gapDetectedTotal);
  }

  // Incrementar contador de eventos aplicados
  incrementEventsApplied(): void {
    this.eventsAppliedTotal.inc();
  }

  // Incrementar contador de eventos ignorados por motivo
  incrementaEventoIgnorado(reason: 'duplicado' | 'desatualizado'): void {
    this.eventsIgnoredTotal.inc({ reason });
  }

  // Incrementar contador de gaps detectados
  incrementGapDetected(): void {
    this.gapDetectedTotal.inc();
  }

  // Obter métricas em formato Prometheus
  async getMetrics(): Promise<string> {
    return register.metrics();
  }
} 