# Sistema de Inventário Distribuído

Sistema centralizado para gestão de inventário com controle de versão e idempotência.

## 🏗️ Arquitetura

- **API Central**: NestJS com SQLite
- **Simulador**: Node.js CLI para gerar eventos
- **Observabilidade**: Health check, métricas Prometheus, logs

## 📡 Endpoints

### Eventos de Estoque
```
POST /v1/eventos/estoque-ajustado
Body: { idEvento, idLoja, sku, delta, versao, dataAtualizacao? }
```

### Consulta de Estoque
```
GET /v1/estoque/{sku}?idLoja={loja}&lojasInclusas=true
```

### Observabilidade
```
GET /health
GET /metrics
```

## 🗄️ Banco de Dados

### Tabelas
- `InventarioPorLoja(idLoja, sku, quantidade, versao, atualizadoEm)`
- `EventoProcessado(idEvento)`

### Regras
- **Idempotência**: Eventos duplicados são ignorados
- **Versão**: Só aplica se `versao > versao_atual`
- **Gap**: Detecta e aplica eventos com versão pulada

## 🎮 Simulador

```bash
node simulator.js
```

**Gera 100 eventos:**
- 70% vendas (delta = -1, diminui estoque)
- 30% reposições (delta = +5, aumenta estoque)
- 10% chance de gap de versão
- Versões sequenciais por `(loja, produto)`

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Docker (opcional)

### Instalação
```bash
# Instalar dependências
npm install

# Configurar banco de dados
npx prisma migrate dev
```

### Desenvolvimento Local
```bash
# Rodar API
npm run start:dev

# Em outro terminal, rodar simulador
node simulator.js
```

### Docker
```bash
# Build da imagem
docker build -t inventory-api .

# Rodar container
docker run -d -p 3001:3000 --name inventory-container inventory-api

# Verificar logs
docker logs inventory-container
```

### Testes
```bash
# Testes unitários
npm test

# Testes E2E
npm run test:e2e
```

### Endpoints
- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api
- **Health**: http://localhost:3000/health
- **Métricas**: http://localhost:3000/metrics

### Limpeza
```bash
# Parar container
docker stop inventory-container
docker rm inventory-container

# Limpar banco
rm prisma/dev.db
npx prisma migrate dev
```

## 📊 Métricas

- `eventos_aplicados_total`
- `eventos_ignorados_total{reason="duplicado"|"desatualizado"|"estoque_negativo"}`
- `gaps_detectados_total`

## 📝 Exemplos

### Enviar evento
```bash
curl -X POST http://localhost:3000/v1/eventos/estoque-ajustado \
  -H "Content-Type: application/json" \
  -d '{
    "idEvento": "evt_123",
    "idLoja": "loja_001", 
    "sku": "PROD_A",
    "delta": -1,
    "versao": 1
  }'
```

### Consultar estoque
```bash
curl "http://localhost:3000/v1/estoque/PROD_A?lojasInclusas=true"
```

### Ver métricas
```bash
curl http://localhost:3000/metrics
``` 