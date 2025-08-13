# Prompts Utilizados

## Desenvolvimento Inicial

### Arquitetura e Design
```
Analise esta solução completa de sistema de inventário distribuído. 
Inclua README, código, testes e documentação. 
Foque em consistência, latência baixa, observabilidade e simulação de persistência.
```

### Refatoração e Melhorias
```
Traduza todos os nomes para português: tabelas, colunas, classes, métodos, DTOs, rotas.
Mantenha consistência em todo o código.
```

## Otimizações Específicas

### Simplificação do Simulador
```
Simplifique o simulador.js removendo complexidade desnecessária.
Mantenha apenas o essencial: geração de eventos, envio para API, logs claros.
```

### Configuração do Docker
```
Crie um Dockerfile simples e funcional para esta aplicação NestJS.
Não use docker-compose, apenas o Dockerfile básico.
```

### Documentação
```
Simplifique o README.md para ser conciso e claro.
Foque no essencial: como executar, endpoints principais, exemplos práticos.
```

## Testes e Qualidade

### Correção de Testes
```
Corrija os testes E2E para testar endpoints reais da aplicação.
Remova referências ao AppController que foi deletado.
```

### Validação de Negócio
```
Implemente validação para evitar estoque negativo.
Adicione métricas para eventos rejeitados por estoque negativo.
```

## Estratégias Técnicas

### Controle de Versão
```
Explique a lógica de versionamento: dto.versao <= estoqueAtual.versao vs dto.versao > estoqueAtual.versao + 1
Discuta implicações de gaps de versão.
```

### Observabilidade
```
Implemente métricas Prometheus para eventos aplicados, ignorados e gaps detectados.
Adicione health check e logs estruturados.
```

## Ferramentas e Produtividade

### Uso do Prisma
```
Configure Prisma com SQLite para simulação de persistência.
Crie migrations e explique o schema do banco.
```

### Swagger e Documentação
```
Configure Swagger para documentação da API.
Simplifique as anotações mantendo exemplos úteis.
``` 