#!/usr/bin/env node

const http = require('http');

// Configuração simples
const config = {
  baseUrl: 'http://localhost:3000',
  endpoint: '/v1/eventos/estoque-ajustado',
  totalEvents: 20,
  eventInterval: 1000
};

// Estado de versões
const versionState = new Map();
const counters = { total: 0, applied: 0, ignored: 0, errors: 0 };

// Inicializar versões
function initializeVersions() {
  console.log('🔄 Inicializando versões...');
  ['loja_001', 'loja_002'].forEach(loja => {
    ['PROD_A', 'PROD_B'].forEach(sku => {
      const key = `${loja}:${sku}`;
      versionState.set(key, 1);
      console.log(`  ${key} -> v1`);
    });
  });
  console.log('✅ Versões inicializadas\n');
}

// Gerar evento
function generateEvent(loja, sku) {
  const key = `${loja}:${sku}`;
  const versao = versionState.get(key);
  versionState.set(key, versao + 1);
  
  const isVenda = Math.random() < 0.8;
  const delta = isVenda ? -1 : 3;
  
  return {
    idEvento: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    idLoja: loja,
    sku: sku,
    delta: delta,
    versao: versao + 1,
    dataAtualizacao: new Date().toISOString()
  };
}

// Enviar evento
function sendEvent(event) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(event);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: config.endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Processar evento
async function processEvent() {
  try {
    const lojas = ['loja_001', 'loja_002'];
    const produtos = ['PROD_A', 'PROD_B'];
    
    const loja = lojas[Math.floor(Math.random() * lojas.length)];
    const sku = produtos[Math.floor(Math.random() * produtos.length)];
    
    const event = generateEvent(loja, sku);
    const tipo = event.delta > 0 ? 'reposição' : 'venda';
    
    console.log(`📤 ${tipo}: ${event.sku} (${event.delta}) - v${event.versao}`);
    
    const response = await sendEvent(event);
    
    if (response.status === 202 || response.status === 200) {
      if (response.data.aplicado) {
        console.log(`✅ Aplicado: ${response.data.status}`);
        counters.applied++;
      } else {
        console.log(`⚠️  Ignorado: ${response.data.status}`);
        counters.ignored++;
      }
    } else {
      console.log(`❌ Erro: ${response.status}`);
      counters.errors++;
    }
    
    counters.total++;
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    counters.errors++;
    counters.total++;
  }
}

// Executar simulação
async function runSimulation() {
  console.log('🚀 Simulador iniciado\n');
  
  initializeVersions();
  
  let current = 0;
  const interval = setInterval(async () => {
    if (current >= config.totalEvents) {
      clearInterval(interval);
      printSummary();
      return;
    }
    
    await processEvent();
    current++;
    
    if (current % 5 === 0) {
      console.log(`📊 ${current}/${config.totalEvents}\n`);
    }
  }, config.eventInterval);
}

// Resumo
function printSummary() {
  console.log('\n📊 RESUMO');
  console.log('==========');
  console.log(`Total: ${counters.total}`);
  console.log(`Aplicados: ${counters.applied}`);
  console.log(`Ignorados: ${counters.ignored}`);
  console.log(`Erros: ${counters.errors}`);
  console.log('\n✅ Simulação concluída!');
}

// Executar
if (require.main === module) {
  runSimulation().catch(console.error);
} 