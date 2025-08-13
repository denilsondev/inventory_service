#!/usr/bin/env node

const http = require('http');

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================
const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  ENDPOINT: '/v1/eventos/estoque-ajustado',
  TOTAL_EVENTOS: 20,
  INTERVALO_EVENTOS: 1000,
  PORTA: 3000
};

// ============================================================================
// CONSTANTES DE NEGÓCIO
// ============================================================================
const ESTRATEGIA_EVENTOS = {
  REPOSICOES_INICIAIS: 8,        // Primeiros 8 eventos são reposições
  DELTA_REPOSICAO_INICIAL: 10,   // Quantidade para criar estoque
  DELTA_REPOSICAO_NORMAL: 5,     // Quantidade para reposições normais
  DELTA_VENDA: -1,               // Quantidade para vendas
  PROBABILIDADE_VENDA: 0.8       // 80% de chance de ser venda
};

const LOJAS = ['loja_001', 'loja_002'];
const PRODUTOS = ['PROD_A', 'PROD_B'];

// ============================================================================
// ESTADO GLOBAL
// ============================================================================
const estadoVersoes = new Map();
const contadores = { 
  total: 0, 
  aplicados: 0, 
  ignorados: 0, 
  erros: 0 
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Inicializa as versões de todos os produtos em todas as lojas
 */
function inicializarVersoes() {
  console.log('🔄 Inicializando versões...');
  
  LOJAS.forEach(loja => {
    PRODUTOS.forEach(sku => {
      const chave = `${loja}:${sku}`;
      estadoVersoes.set(chave, 1);
      console.log(`  ${chave} -> v1`);
    });
  });
  
  console.log('✅ Versões inicializadas\n');
}

/**
 * Gera um evento baseado na estratégia de negócio
 * @param {string} loja - ID da loja
 * @param {string} sku - SKU do produto
 * @param {number} numeroEvento - Número sequencial do evento
 * @returns {Object} Evento gerado
 */
function gerarEvento(loja, sku, numeroEvento) {
  const chave = `${loja}:${sku}`;
  const versaoAtual = estadoVersoes.get(chave);
  const novaVersao = versaoAtual + 1;
  
  // Atualiza a versão para o próximo evento
  estadoVersoes.set(chave, novaVersao);
  
  // Define o tipo e delta baseado na estratégia
  const { delta, tipo } = determinarTipoEvento(numeroEvento);
  
  return {
    idEvento: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    idLoja: loja,
    sku: sku,
    delta: delta,
    versao: novaVersao,
    dataAtualizacao: new Date().toISOString()
  };
}

/**
 * Determina o tipo de evento baseado na estratégia de negócio
 * @param {number} numeroEvento - Número sequencial do evento
 * @returns {Object} { delta: number, tipo: string }
 */
function determinarTipoEvento(numeroEvento) {
  if (numeroEvento < ESTRATEGIA_EVENTOS.REPOSICOES_INICIAIS) {
    // Primeiros eventos: reposições para criar estoque
    return {
      delta: ESTRATEGIA_EVENTOS.DELTA_REPOSICAO_INICIAL,
      tipo: 'reposição'
    };
  }
  
  // Eventos subsequentes: vendas ou reposições
  const ehVenda = Math.random() < ESTRATEGIA_EVENTOS.PROBABILIDADE_VENDA;
  
  return {
    delta: ehVenda ? ESTRATEGIA_EVENTOS.DELTA_VENDA : ESTRATEGIA_EVENTOS.DELTA_REPOSICAO_NORMAL,
    tipo: ehVenda ? 'venda' : 'reposição'
  };
}

/**
 * Envia um evento para a API
 * @param {Object} evento - Evento a ser enviado
 * @returns {Promise<Object>} Resposta da API
 */
function enviarEvento(evento) {
  return new Promise((resolve, reject) => {
    const dadosPost = JSON.stringify(evento);
    
    const opcoes = {
      hostname: 'localhost',
      port: CONFIG.PORTA,
      path: CONFIG.ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dadosPost)
      }
    };
    
    const requisicao = http.request(opcoes, (resposta) => {
      let dados = '';
      
      resposta.on('data', chunk => dados += chunk);
      resposta.on('end', () => {
        try {
          const respostaJson = JSON.parse(dados);
          resolve({ 
            status: resposta.statusCode, 
            dados: respostaJson 
          });
        } catch (erro) {
          resolve({ 
            status: resposta.statusCode, 
            dados: dados 
          });
        }
      });
    });
    
    requisicao.on('error', reject);
    requisicao.write(dadosPost);
    requisicao.end();
  });
}

/**
 * Interpreta a resposta da API e atualiza contadores
 * @param {Object} resposta - Resposta da API
 * @returns {string} Status do processamento
 */
function interpretarResposta(resposta) {
  if (resposta.status === 201 || resposta.status === 200) {
    if (resposta.dados && resposta.dados.aplicado) {
      contadores.aplicados++;
      return `✅ Aplicado: ${resposta.dados.status}`;
    } else if (resposta.dados && !resposta.dados.aplicado) {
      contadores.ignorados++;
      return `⚠️  Ignorado: ${resposta.dados.status}`;
    } else {
      contadores.aplicados++;
      return `✅ Evento processado (status: ${resposta.status})`;
    }
  } else if (resposta.status === 400) {
    contadores.ignorados++;
    return `⚠️  Rejeitado: ${resposta.dados?.message || 'Bad Request'}`;
  } else {
    contadores.erros++;
    return `❌ Erro: ${resposta.status}`;
  }
}

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Processa um evento individual
 * @param {number} numeroEvento - Número sequencial do evento
 */
async function processarEvento(numeroEvento) {
  try {
    // Seleciona loja e produto aleatoriamente
    const loja = LOJAS[Math.floor(Math.random() * LOJAS.length)];
    const sku = PRODUTOS[Math.floor(Math.random() * PRODUTOS.length)];
    
    // Gera e envia o evento
    const evento = gerarEvento(loja, sku, numeroEvento);
    const tipo = evento.delta > 0 ? 'reposição' : 'venda';
    
    console.log(`📤 ${tipo}: ${evento.sku} (${evento.delta}) - v${evento.versao}`);
    
    const resposta = await enviarEvento(evento);
    const statusProcessamento = interpretarResposta(resposta);
    
    console.log(statusProcessamento);
    contadores.total++;
    
  } catch (erro) {
    console.log(`❌ Erro: ${erro.message}`);
    contadores.erros++;
    contadores.total++;
  }
}

/**
 * Executa a simulação completa
 */
async function executarSimulacao() {
  console.log('🚀 Simulador iniciado\n');
  
  inicializarVersoes();
  
  let eventoAtual = 0;
  const intervalo = setInterval(async () => {
    if (eventoAtual >= CONFIG.TOTAL_EVENTOS) {
      clearInterval(intervalo);
      exibirResumo();
      return;
    }
    
    await processarEvento(eventoAtual);
    eventoAtual++;
    
    // Exibe progresso a cada 5 eventos
    if (eventoAtual % 5 === 0) {
      console.log(`📊 ${eventoAtual}/${CONFIG.TOTAL_EVENTOS}\n`);
    }
  }, CONFIG.INTERVALO_EVENTOS);
}

/**
 * Exibe o resumo final da simulação
 */
function exibirResumo() {
  console.log('\n📊 RESUMO');
  console.log('==========');
  console.log(`Total: ${contadores.total}`);
  console.log(`Aplicados: ${contadores.aplicados}`);
  console.log(`Ignorados: ${contadores.ignorados}`);
  console.log(`Erros: ${contadores.erros}`);
  console.log('\n✅ Simulação concluída!');
}

// ============================================================================
// EXECUÇÃO
// ============================================================================
if (require.main === module) {
  executarSimulacao().catch(console.error);
} 