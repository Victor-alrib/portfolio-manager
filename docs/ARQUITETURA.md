# Portfolio Manager

Plataforma pessoal para organizar, acompanhar e documentar projetos técnicos e a preparação profissional. A versão pública vem com dados de exemplo fictícios.

## Funcionalidades

| Módulo | O que faz |
|---|---|
| **Dashboard** | Projetos ativos, concluídos, publicados e ideias; progresso geral; próximas entregas; tecnologias; competências (atual × meta); plano de carreira e fases do roadmap; ações sugeridas. |
| **Projetos** | Nome, descrição, objetivo, área, tecnologias, entregáveis, etapas (com datas e reordenação), datas importantes, arquivos (upload pequeno ou referência), links, anotações, competências vinculadas e histórico de etapas. Busca, filtros e visão lista/grade. |
| **Kanban** | Ideias → Planejamento → Em desenvolvimento → Testes → Documentação → Publicado. Arrastar e soltar (com reordenação) ou setas para mover. |
| **Documentação** | Gerador de README (Problema, Dados, Abordagem, Tecnologias, Metodologia, Resultados, Aprendizados, Próximos passos) com guias, pré-visualização, cópia e download. |
| **Competências** | Roteiro de estudo (8 itens, em ordem, com conteúdo, motivo e critério de “concluído”), níveis 0–5, meta, histórico e vínculo com projetos (planejada/aplicada + evidência). |
| **Vagas** | Requisitos técnicos, mapeamento automático para competências, aderência ponderada, lacunas e plano para fechá-las, demanda agregada. |
| **Entrevistas** | Ficha STAR + pitch por projeto, perguntas prováveis geradas a partir das tecnologias. |
| **LinkedIn** | Rascunhos a partir de modelos (lançamento, aprendizado, progresso), contador de caracteres, marcadores `[a completar]`. |
| **Exportar** | README `.md`, resumo de projetos em PDF, relatório de progresso (PDF/MD), backup JSON (exportar e importar). |

### Regra de integridade
O app **nunca inventa métricas, resultados ou experiências**. Seções vazias viram pendências explícitas; “Resultados” vazio vira aviso; números em resultados não verificados são rotulados como preliminares; modelos de post só usam resultados que o autor marcou como verificados.

## Stack e arquitetura

React 18 · TypeScript · Tailwind CSS · Zustand · Recharts · jsPDF · Vite

```
src/
  types.ts              Modelo de dados (versão de esquema)
  router.ts             Roteamento por hash (#kanban, #projeto-<id> …)
  store/
    store.ts            Estado global e ações (Zustand)
    seed.ts             Dados de exemplo (4 projetos planejados + roteiro de competências)
    migrations.ts       Normalização/migração de dados importados ou antigos
    persistence.ts      Cache em localStorage
    sync.ts             Sincronização com o armazenamento da conta (quando hospedado)
  lib/                  Métricas, geradores de Markdown/PDF, downloads, utilitários
  components/           UI base (botões, campos, modal, toasts, markdown), Sidebar, busca (Ctrl K)
  features/             Um módulo por área: dashboard, projects, kanban, readme, skills, jobs, interview, linkedin, export, settings
```

Para adicionar um módulo: crie `src/features/<nome>/`, registre a rota em `router.ts`, o item em `components/Sidebar.tsx` e o `case` em `App.tsx`. Para mudar o modelo de dados, incremente `SCHEMA_VERSION` e trate o novo campo em `store/migrations.ts`.

### Persistência
- Sempre: `localStorage` (cache imediato).
- Quando hospedado como artifact no claude.ai: cada entidade é salva como um documento na área privada do usuário, com escrita incremental (só o que mudou).
- Backup/restauração completos via JSON na página Exportar.

## Rodando localmente

```bash
npm install
npm run dev        # desenvolvimento
npm run build      # gera dist/index.html (arquivo único, autocontido)
npm run typecheck
```
