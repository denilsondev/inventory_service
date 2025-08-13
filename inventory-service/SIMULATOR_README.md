# 🚀 Simulador de Eventos de Estoque

## 📋 Descrição

Simulador simples para testar o sistema de inventário, gerando eventos de ajuste de estoque de forma realista.

## 🎯 Como usar

### 1. **Pré-requisitos**
- ✅ Aplicação rodando em `http://localhost:3000`
- ✅ Banco de dados configurado e migrado

### 2. **Executar simulação**
```bash
npm run simulate
```

### 3. **Estratégia de eventos**
O simulador segue uma estratégia inteligente:

#### **🔄 Primeiros 8 eventos:**
- **100% reposições** (+10 unidades)
- **Objetivo:** Criar estoque inicial para permitir vendas

#### **🛒 Eventos subsequentes:**
- **80% vendas** (-1 unidade)
- **20% reposições** (+5 unidades)
- **Objetivo:** Simular fluxo real de negócio

### 4. **Controle de versões**
- ✅ **Versões sequenciais** por `(idLoja, sku)`
- ✅ **Prevenção de conflitos** de versão
- ✅ **Simulação de gaps** ocasionais

### 5. **Exemplo de saída**
```
🚀 Simulador iniciado

🔄 Inicializando versões...
  loja_001:PROD_A -> v1
  loja_001:PROD_B -> v1
  loja_002:PROD_A -> v1
  loja_002:PROD_B -> v1
✅ Versões inicializadas

📤 reposição: PROD_A (10) - v2
✅ Aplicado: aplicado
📤 reposição: PROD_B (10) - v2
⚠️  Ignorado: versao_desatualizada
📤 venda: PROD_A (-1) - v3
✅ Aplicado: aplicado

📊 RESUMO
==========
Total: 20
Aplicados: 10
Ignorados: 10
Erros: 0

✅ Simulação concluída!
```

### 6. **Cenários testados**
O simulador testa automaticamente:

#### **✅ Cenários de sucesso:**
- **Reposições iniciais** criando estoque
- **Vendas com estoque** disponível
- **Gaps de versão** detectados e processados

#### **⚠️ Cenários de rejeição:**
- **Versões desatualizadas** (idempotência)
- **Estoque negativo** (validação de negócio)
- **Eventos duplicados** (controle de idempotência)

### 7. **Configuração**
O simulador usa configuração hardcoded simples:

```javascript
const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  ENDPOINT: '/v1/eventos/estoque-ajustado',
  TOTAL_EVENTOS: 20,
  INTERVALO_EVENTOS: 1000,  // 1 segundo
  PORTA: 3000
};
```

### 8. **Troubleshooting**

#### **❌ "connect ECONNREFUSED 127.0.0.1:3000"**
- **Solução:** Inicie a aplicação primeiro com `npm run start:dev`

#### **⚠️ Muitos eventos ignorados**
- **Normal:** Sistema está funcionando corretamente
- **Versões desatualizadas** são rejeitadas (idempotência)
- **Estoque negativo** é rejeitado (validação)

#### **📊 Métricas**
Verifique as métricas da aplicação:
```bash
curl http://localhost:3000/metrics
```

### 9. **Parar simulação**
- **Automático:** Para após `TOTAL_EVENTOS` eventos
- **Manual:** Use `Ctrl+C` para interromper

## 🏗️ Arquitetura

### **📁 Estrutura do código:**
```
simulator.js
├── CONFIGURAÇÃO
├── CONSTANTES DE NEGÓCIO
├── ESTADO GLOBAL
├── FUNÇÕES AUXILIARES
│   ├── inicializarVersoes()
│   ├── gerarEvento()
│   ├── determinarTipoEvento()
│   ├── enviarEvento()
│   └── interpretarResposta()
├── FUNÇÕES PRINCIPAIS
│   ├── processarEvento()
│   ├── executarSimulacao()
│   └── exibirResumo()
└── EXECUÇÃO
```

### **🎯 Responsabilidades:**
- **Geração de eventos** realistas
- **Controle de versões** sequenciais
- **Tratamento de respostas** da API
- **Exibição de estatísticas** claras

## 📈 Melhorias implementadas

### **✅ Código limpo:**
- **Nomenclatura em português** consistente
- **Constantes extraídas** e documentadas
- **Funções com responsabilidade única**
- **Documentação JSDoc** completa

### **✅ Estratégia inteligente:**
- **Reposições iniciais** para criar estoque
- **Fluxo realista** de vendas e reposições
- **Prevenção de estoque negativo**

### **✅ Tratamento robusto:**
- **Diferentes tipos** de resposta da API
- **Contadores separados** para estatísticas
- **Tratamento de erros** adequado 