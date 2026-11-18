# Resultados

Este projeto é uma aplicação web, não um modelo de ML, então **não existem métricas de desempenho de modelo**. O que existe são verificações técnicas executadas de verdade: o build e todos os testes foram rodados de novo em 17/11/2026, sobre a versão final do código.

## O que foi verificado (e onde está a evidência)

| Verificação | Resultado | Evidência |
|---|---|---|
| Checagem de tipos (`tsc --noEmit`) | 0 erros | `logs/typecheck.log` |
| Build de produção (Vite) | 3067 módulos; `index.html` de 1.557,08 kB (gzip 466,95 kB); 6,27 s | `logs/build.log` |
| Tamanho do código | 34 arquivos `.ts`/`.tsx`, 4.718 linhas em `src/` | contagem com `wc -l` |
| E2E: 11 telas | Todas carregaram; 0 erros no console | `logs/teste-smoke.log`, `capturas/` |
| E2E: Kanban | Arrastar e soltar moveu o card para "Em desenvolvimento" (1/1); a seta "próxima etapa" moveu outro card (1/1) | `logs/teste-smoke.log`, `capturas/07-kanban-apos-arrastar.png` |
| E2E: criação | Projeto novo criado e aberto; etapa adicionada e marcada | `capturas/08-projeto-novo-com-etapa.png` |
| E2E: exportações | 4 arquivos gerados: README `.md`, backup `.json`, resumo PDF, relatório PDF | `exemplos-de-saida/` |
| E2E: persistência | 5 projetos continuavam lá após recarregar a página | `logs/teste-smoke.log` |
| E2E: vagas, LinkedIn e busca | 6 requisitos colados: 4 associados automaticamente a competências (incluindo "Azure ou Databricks" → Cloud), 2 (Power BI e Kubernetes) não; aderência calculada de 22% para a vaga de teste com os dados de exemplo; rascunho criado; Ctrl+K levou ao projeto certo | `logs/teste-fluxos.log`, `capturas/12-…`, `capturas/15-…` |
| Sincronização (**banco simulado**) | 17 documentos na primeira carga; 2 gravações ao mover 1 card; status "Sincronizado" | `logs/teste-sincronizacao.log` |

Observação: os logs dos testes imprimem valores (por exemplo, `drag moved to dev: 1`) que conferi manualmente. Não são asserts automáticos.

## Conteúdo da pasta

- `capturas/`: 18 telas (tema escuro e claro, celular de 390 px).
- `exemplos-de-saida/`: PDFs de resumo e de progresso, um README gerado pelo app (projeto ainda vazio, mostrando as pendências e o aviso de "sem resultados") e o backup JSON com os dados de exemplo.
- `logs/`: saídas do typecheck, do build e dos três scripts de teste.

## Próximas validações

- Desempenho de carregamento e acessibilidade com Lighthouse.
- Testes unitários com Vitest e cobertura das funções de `src/lib/`.
- Precisão do mapeamento requisito → competência, rotulando requisitos de vagas reais.
- Sincronização em ambiente real, editando em dois dispositivos.
- Compatibilidade com Firefox, Safari e Edge.
