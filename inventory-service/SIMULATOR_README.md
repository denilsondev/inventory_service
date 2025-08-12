# 🚀 Simulador de Eventos de Estoque

## Como usar

### 1. **Configuração**
- Edite `simulator-config.json` para ajustar:
  - URL da API (`baseUrl`)
  - Intervalo entre eventos (`eventInterval`)
  - Total de eventos (`totalEvents`)
  - Lojas e produtos

### 2. **Executar simulação**
```bash
# Simulação padrão (100 eventos, 2s entre cada)
npm run simulate

# Simulação rápida (500ms entre eventos)
npm run simulate:fast

# Simulação contínua (1000 eventos)
npm run simulate:continuous
```

### 3. **O que o simulador faz**
- ✅ Gera eventos aleatórios (80% vendas -1, 20% reposição +5)
- ✅ Controla versões por `(storeId, sku)`
- ✅ Implementa retries com backoff
- ✅ Duplica eventos ocasionalmente (10% chance)
- ✅ Mostra progresso e estatísticas

### 4. **Exemplo de saída**
```
🚀 Iniciando simulação de eventos de estoque...

🔄 Inicializando estado de versões...
  store_001:PROD_ABC123 -> versão 1
  store_001:PROD_DEF456 -> versão 1
  store_001:PROD_GHI789 -> versão 1
✅ Estado de versões inicializado

📤 Enviando venda: evt_1234567890_abc123
   Store: store_001, SKU: PROD_ABC123, Delta: -1, Versão: 2
✅ Evento aplicado: applied
📊 Progresso: 1/100

📊 RESUMO DA SIMULAÇÃO
========================
Total de eventos: 100
Eventos aplicados: 85
Eventos ignorados: 12
Erros: 0
Duplicações: 3
```

### 5. **Parar simulação**
- Use `Ctrl+C` para interromper
- O simulador para automaticamente após o total de eventos

### 6. **Troubleshooting**
- **API não responde**: Verifique se o serviço está rodando em `http://localhost:8080`
- **Erros de rede**: Ajuste `timeout` e `retries` no config
- **Muitos eventos ignorados**: Verifique se as versões estão corretas 