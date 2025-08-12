#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Carregar configuração
const config = JSON.parse(fs.readFileSync('./simulator-config.json', 'utf8'));

// Estado global para controle de versões
const versionState = new Map(); // (storeId, sku) -> version
const eventCounters = {
  total: 0,
  applied: 0,
  ignored: 0,
  errors: 0,
  duplicates: 0
};

// Inicializar estado de versões
function initializeVersionState() {
  console.log('🔄 Inicializando estado de versões...');
  
  config.stores.forEach(storeId => {
    config.products.forEach(product => {
      const key = `${storeId}:${product.sku}`;
      versionState.set(key, product.initialVersion);
      console.log(`  ${key} -> versão ${product.initialVersion}`);
    });
  });
  
  console.log('✅ Estado de versões inicializado\n');
}

// Gerar ID único para evento
function generateEventId() {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Gerar evento de ajuste de estoque
function generateStockEvent(storeId, sku) {
  const key = `${storeId}:${sku}`;
  const currentVersion = versionState.get(key);
  const nextVersion = currentVersion + 1;
  
  // 80% vendas (-1), 20% reposição (+5)
  const isSale = Math.random() < config.simulation.salesRatio;
  const delta = isSale ? -1 : 5;
  const eventType = isSale ? 'venda' : 'reposição';
  
  // Gerar evento
  const event = {
    eventId: generateEventId(),
    storeId,
    sku,
    delta,
    version: nextVersion,
    occurredAt: new Date().toISOString()
  };
  
  // Atualizar versão no estado local
  versionState.set(key, nextVersion);
  
  return { event, eventType, nextVersion };
}

// Função de retry com backoff simples
async function sendEventWithRetry(event, attempt = 1) {
  const maxRetries = config.api.retries;
  const retryDelay = config.api.retryDelay * attempt;
  
  try {
    const response = await sendEvent(event);
    return response;
  } catch (error) {
    if (attempt <= maxRetries) {
      console.log(`⚠️  Tentativa ${attempt} falhou, tentando novamente em ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return sendEventWithRetry(event, attempt + 1);
    } else {
      throw new Error(`Falha após ${maxRetries} tentativas: ${error.message}`);
    }
  }
}

// Enviar evento para a API
function sendEvent(event) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.api.endpoint, config.api.baseUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(event);
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: config.api.timeout
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

// Processar evento
async function processEvent(storeId, sku) {
  try {
    // Gerar evento
    const { event, eventType, nextVersion } = generateStockEvent(storeId, sku);
    
    console.log(`📤 Enviando ${eventType}: ${event.eventId}`);
    console.log(`   Store: ${storeId}, SKU: ${sku}, Delta: ${event.delta}, Versão: ${nextVersion}`);
    
    // Enviar com retry
    const response = await sendEventWithRetry(event);
    
    // Processar resposta
    if (response.status === 202) {
      console.log(`✅ Evento aplicado: ${response.data.status}`);
      eventCounters.applied++;
    } else if (response.status === 200) {
      console.log(`⚠️  Evento não aplicado: ${response.data.status}`);
      eventCounters.ignored++;
    } else {
      console.log(`❌ Erro inesperado: ${response.status}`);
      eventCounters.errors++;
    }
    
    eventCounters.total++;
    
  } catch (error) {
    console.log(`❌ Erro ao processar evento: ${error.message}`);
    eventCounters.errors++;
    eventCounters.total++;
  }
}

// Simular duplicação ocasional
function shouldDuplicate() {
  return Math.random() < config.simulation.duplicationChance;
}

// Executar simulação
async function runSimulation() {
  console.log('🚀 Iniciando simulação de eventos de estoque...\n');
  
  initializeVersionState();
  
  const totalEvents = config.simulation.totalEvents;
  let currentEvent = 0;
  
  const interval = setInterval(async () => {
    if (currentEvent >= totalEvents) {
      clearInterval(interval);
      printSummary();
      return;
    }
    
    // Selecionar loja e produto aleatoriamente
    const storeId = config.stores[Math.floor(Math.random() * config.stores.length)];
    const product = config.products[Math.floor(Math.random() * config.products.length)];
    
    // Processar evento
    await processEvent(storeId, product.sku);
    
    // Duplicação ocasional para testar idempotência
    if (shouldDuplicate()) {
      console.log(`🔄 Duplicando evento para testar idempotência...`);
      await processEvent(storeId, product.sku);
      eventCounters.duplicates++;
    }
    
    currentEvent++;
    console.log(`📊 Progresso: ${currentEvent}/${totalEvents}\n`);
    
  }, config.simulation.eventInterval);
}

// Imprimir resumo
function printSummary() {
  console.log('\n📊 RESUMO DA SIMULAÇÃO');
  console.log('========================');
  console.log(`Total de eventos: ${eventCounters.total}`);
  console.log(`Eventos aplicados: ${eventCounters.applied}`);
  console.log(`Eventos ignorados: ${eventCounters.ignored}`);
  console.log(`Erros: ${eventCounters.errors}`);
  console.log(`Duplicações: ${eventCounters.duplicates}`);
  console.log('\n🎯 Simulação concluída!');
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promessa rejeitada não tratada:', reason);
  process.exit(1);
});

// Executar simulação
if (require.main === module) {
  runSimulation().catch(error => {
    console.error('❌ Erro fatal na simulação:', error);
    process.exit(1);
  });
}

module.exports = { runSimulation, processEvent }; 