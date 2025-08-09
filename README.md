## Inventory Challenge — Plano e Registro

### Enunciado (resumo)
Este desafio pede um protótipo de melhoria para um sistema de inventário distribuído (lojas com BD local e um serviço central), priorizando:
- Consistência entre lojas e central (idempotência e ordenação de eventos)
- Baixa latência de escrita/leitura percebida
- Observabilidade mínima (health, métricas, logs)
- Persistência simulada (JSON/CSV/SQLite) e API documentada
- Entregáveis: README, diagrama e instruções de execução (run.md)

Observação: cole abaixo o enunciado completo (texto oficial) quando quiser para mantermos o histórico:

> Cole aqui o enunciado completo...

---

### Decisões de arquitetura (MVP)
- Topologia: Serviço Central (API) + Simulador de Lojas (CLI)
- Transporte: HTTP com retries no cliente (at-least-once) + idempotência no servidor
- Consistência: idempotência por `eventId` e ordenação lógica por `version` por `(storeId, sku)`
- Persistência: SQLite com duas tabelas principais
- Observabilidade: `GET /health`, `GET /metrics` (Prometheus), logs JSON
- Evolução futura: fila/mensageria como bônus (mantemos o código pronto para isso)

### Endpoints do Serviço Central (MVP)
- POST `/v1/events/stock-adjusted`
  - Body: `{ eventId, storeId, sku, delta, version, occurredAt? }`
  - Regras:
    - Ignorar duplicados por `eventId` (idempotência via `seen_events`)
    - Aplicar apenas se `version` for maior que a atual por `(storeId, sku)`
    - Se houver pulo de versão (gap), aplicar e contar métrica
  - Respostas:
    - 202 `{ applied: true, status: "applied", currentVersion, currentQuantity }`
    - 200 `{ applied: false, status: "duplicate_event"|"stale_version"|"gap_detected", currentVersion, currentQuantity }`

- GET `/v1/inventory/{sku}`
  - Query: `storeId?`, `includeStores?=true`
  - Resposta: `{ sku, totalQuantity, perStore: [{ storeId, quantity, version, updatedAt }] }`

- Infra:
  - GET `/health` → estado do serviço (e DB quando implementado)
  - GET `/metrics` → contadores em formato Prometheus

### Modelo de dados (SQLite)
- `per_store_inventory(
    store_id TEXT,
    sku TEXT,
    quantity INTEGER,
    version INTEGER,
    updated_at TEXT,
    PRIMARY KEY(store_id, sku)
  )`
- `seen_events(
    event_id TEXT PRIMARY KEY
  )`
- Índice extra: `CREATE INDEX IF NOT EXISTS idx_inventory_sku ON per_store_inventory(sku);`

### Fluxo de eventos (HTTP)
1) Simulador envia `POST /v1/events/stock-adjusted` com `{eventId, storeId, sku, delta, version}`
2) Servidor verifica duplicado em `seen_events` (INSERT OR IGNORE)
3) Aplica `UPSERT` condicional por versão (só atualiza se `version` nova for maior)
4) Responde com status/versão/quantidade atual; contabiliza métricas

### Observabilidade
- Logs JSON com `x-correlation-id`, `eventId`, `storeId`, `sku`
- Métricas:
  - `events_applied_total`
  - `events_ignored_total{reason="duplicate"|"stale"}`
  - `gap_detected_total`
- Health: verifica serviço e acesso ao SQLite

### Plano por fases (checklist)
1) Scaffold do serviço (`inventory-service`) com NestJS + Express e `GET /health` [feito]
2) Configurar SQLite (better-sqlite3), `schema.sql`, provider de DB
3) Implementar `POST /v1/events/stock-adjusted` com idempotência e versão
4) Implementar `GET /v1/inventory/{sku}` (total e por loja)
5) Observabilidade: `/metrics` (Prometheus) e logs JSON; health checando DB
6) Simulador de Lojas (CLI): gera eventos (80% vendas -1, 20% reposição +5), versões por `(storeId, sku)`, retries e duplicação ocasional
7) Testes (Vitest): duplicado, versão velha, gap, consulta
8) Documentos: `run.md`, diagrama (Mermaid), `prompts.md`

### Critérios de aceite
- Eventos novos aplicados; duplicados/versões antigas ignorados
- Gap detectado e metricado
- Consulta por SKU retorna totais e por loja
- `/health` e `/metrics` disponíveis
- Simulador gera 100+ eventos por loja e o estado central fica consistente
- Testes do MVP passam

### Bônus (se sobrar tempo)
- Bulk: `POST /v1/events/stock-adjusted/bulk` (207 Multi-Status)
- Docker: `Dockerfile` + `docker-compose.yml`
- Reservas (no-oversell): endpoints para criar/confirmar/cancelar reservas, TTL e expiração
- Mensageria: RabbitMQ (publisher no simulador, consumer no serviço), partição por `storeId`
- Tracing básico (OpenTelemetry) opcional

### Como rodar (dev)
- Serviço: `cd inventory-service && npm install && npm run start:dev`
- Porta: 8080 (`GET http://localhost:8080/health`)
- Observação: nomes de classes/métodos em português para alinhamento do código

### Histórico (modo passo-a-passo)
- 1) Criado serviço NestJS `inventory-service` e rota `/health` (porta 8080)
- Próximo: fase 2 (SQLite) — após aprovação 