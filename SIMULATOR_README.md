# Simulador de Eventos de Estoque

Simulador simples para testar o sistema de inventário.

## Como usar

### Pré-requisitos
- Aplicação rodando em `http://localhost:3000`
- Banco de dados configurado

### Executar
```bash
node simulator.js
```

## Configuração

```javascript
const TOTAL_EVENTOS = 100;
const INTERVALO = 1000; // 1 segundo
const LOJAS = ['loja_001', 'loja_002'];
const PRODUTOS = ['PROD_A', 'PROD_B'];
```

## Estratégia

- **70% vendas** (delta = -1)
- **30% reposições** (delta = +5)
- **10% chance de gap** de versão
- **Versões sequenciais** por `(loja, produto)`

## Exemplo de saída

```
🚀 Simulador iniciado

🔄 Inicializando...
  loja_001:PROD_A -> v1
  loja_001:PROD_B -> v1
  loja_002:PROD_A -> v1
  loja_002:PROD_B -> v1
✅ Pronto!

📤 loja_001: reposição PROD_A (+5) - v1
APLICADO
📤 loja_002: venda PROD_B (-1) - v1
APLICADO
📤 loja_001: venda PROD_A (-1) - v2
APLICADO

📊 5/100

✅ Simulação concluída!
```

## Cenários testados

- ✅ **Aplicados**: Eventos válidos
- ⚠️ **Ignorados**: Duplicados, versões desatualizadas
- ❌ **Rejeitados**: Estoque negativo
- 🔍 **Gaps**: Versões puladas (detectados)

## Troubleshooting

**Erro de conexão**: Verifique se a API está rodando
**Muitos ignorados**: Normal - sistema funcionando corretamente 