#!/usr/bin/env node

const http = require('http');

// ============================================================================
// CONFIGURAÇÃO SIMPLES
// ============================================================================
const TOTAL_EVENTOS = 100;
const INTERVALO = 1000; // 1 segundo

// ============================================================================
// DADOS FIXOS
// ============================================================================
const LOJAS = ['loja_001', 'loja_002'];
const PRODUTOS = ['PROD_A', 'PROD_B'];

// ============================================================================
// ESTADO
// ============================================================================
const versoes = new Map(); // Guarda versão de cada produto em cada loja
let contador = 0; // Conta eventos processados

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

// Gera um evento simples
function gerarEvento() {
  // Escolhe loja e produto aleatoriamente
  const loja = LOJAS[Math.floor(Math.random() * LOJAS.length)];
  const sku = PRODUTOS[Math.floor(Math.random() * PRODUTOS.length)];
  
  // Pega versão atual
  const chave = `${loja}:${sku}`;
  const versaoAtual = versoes.get(chave);
  
  // Define se é venda ou reposição
  const ehVenda = Math.random() < 0.7; // 70% chance de venda
  const delta = ehVenda ? -1 : 5;
  
  // Versão com chance de gap
  const versao = Math.random() < 0.1 ? versaoAtual + 2 : versaoAtual + 1;
  versoes.set(chave, versao);
  
  // ID único simples
  const idEvento = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`;
  
  return {
    idEvento: idEvento,
    idLoja: loja,
    sku: sku,
    delta: delta,
    versao: versao,
    dataAtualizacao: new Date().toISOString()
  };
}

// Envia evento para a API
function enviarEvento(evento) {
  return new Promise((resolve, reject) => {
    const dados = JSON.stringify(evento);
    
                    const opcoes = {
                  hostname: 'localhost',
                  port: 3000,
      path: '/v1/eventos/estoque-ajustado',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dados)
      }
    };
    
    const req = http.request(opcoes, (res) => {
      let resposta = '';
      res.on('data', chunk => resposta += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(resposta);
          resolve({ status: res.statusCode, dados: json });
        } catch (e) {
          resolve({ status: res.statusCode, dados: resposta });
        }
      });
    });
    
    req.on('error', reject);
    req.write(dados);
    req.end();
  });
}

// Processa um evento
async function processarEvento() {
  try {
    // Gera evento
    const evento = gerarEvento();
    const tipo = evento.delta > 0 ? 'reposição' : 'venda';
    
    console.log(`📤 ${evento.idLoja}: ${tipo} ${evento.sku} (${evento.delta > 0 ? '+' : ''}${evento.delta}) - v${evento.versao}`);
    
    // Envia para API
    const resposta = await enviarEvento(evento);
    
    // Mostra resultado
    if (resposta.status === 201 || resposta.status === 200) {
      if (resposta.dados && resposta.dados.aplicado) {
        console.log(`✅ Aplicado`);
      } else {
        console.log(`⚠️  Ignorado: ${resposta.dados?.status || 'desconhecido'}`);
      }
    } else if (resposta.status === 400) {
      console.log(`⚠️  Rejeitado: ${resposta.dados?.message || 'erro'}`);
    } else {
      console.log(`❌ Erro: ${resposta.status}`);
    }
    
    contador++;
    
  } catch (erro) {
    console.log(`❌ Erro: ${erro.message}`);
    contador++;
  }
}

// Executa simulação
async function executar() {
  console.log('🚀 Simulador iniciado\n');
  
  // Inicializa versões
  console.log('🔄 Inicializando...');
  LOJAS.forEach(loja => {
    PRODUTOS.forEach(sku => {
      const chave = `${loja}:${sku}`;
      versoes.set(chave, 1);
      console.log(`  ${chave} -> v1`);
    });
  });
  console.log('✅ Pronto!\n');
  
  // Processa eventos a cada segundo
  const intervalo = setInterval(async () => {
    if (contador >= TOTAL_EVENTOS) {
      clearInterval(intervalo);
      console.log('\n✅ Simulação concluída!');
      return;
    }
    
    await processarEvento();
    
    // Mostra progresso a cada 5 eventos
    if (contador % 5 === 0) {
      console.log(`📊 ${contador}/${TOTAL_EVENTOS}\n`);
    }
  }, INTERVALO);
}

// ============================================================================
// EXECUTAR
// ============================================================================
executar().catch(console.error); 