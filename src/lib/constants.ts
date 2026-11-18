import type { JobStage, PostKind, PostStatus, Priority, Stage } from "../types";

export const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: "ideias", label: "Ideias", hint: "Ainda não priorizado" },
  { id: "planejamento", label: "Planejamento", hint: "Escopo, dados e abordagem" },
  { id: "desenvolvimento", label: "Em desenvolvimento", hint: "Código e experimentos" },
  { id: "testes", label: "Testes", hint: "Validação e revisão" },
  { id: "documentacao", label: "Documentação", hint: "README, relatório, post" },
  { id: "publicado", label: "Publicado", hint: "Disponível publicamente" },
];

export const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.id, s.label])) as Record<Stage, string>;
export const STAGE_INDEX = Object.fromEntries(STAGES.map((s, i) => [s.id, i])) as Record<Stage, number>;

/**
 * Paleta categórica validada (ordem fixa, nunca reciclada).
 * Valores light/dark por slot — ver skill dataviz/palette.
 */
export const SERIES = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
};

/** Cada etapa do Kanban tem uma cor fixa (identidade da etapa). */
export const STAGE_SLOT: Record<Stage, number> = {
  ideias: 6, // violeta
  planejamento: 0, // azul
  desenvolvimento: 1, // laranja
  testes: 3, // amarelo
  documentacao: 4, // magenta
  publicado: 2, // aqua
};

export const PRIORITY: Record<Priority, { label: string; cls: string }> = {
  alta: { label: "Alta", cls: "text-red-500 dark:text-red-400" },
  media: { label: "Média", cls: "text-amber-600 dark:text-amber-400" },
  baixa: { label: "Baixa", cls: "text-mute" },
};

export const JOB_STAGES: { id: JobStage; label: string }[] = [
  { id: "interesse", label: "Interesse" },
  { id: "candidatura", label: "Candidatura enviada" },
  { id: "entrevista", label: "Em entrevistas" },
  { id: "oferta", label: "Oferta" },
  { id: "encerrada", label: "Encerrada" },
];

export const POST_KINDS: { id: PostKind; label: string }[] = [
  { id: "lancamento", label: "Lançamento de projeto" },
  { id: "aprendizado", label: "Aprendizado técnico" },
  { id: "progresso", label: "Atualização de progresso" },
  { id: "livre", label: "Livre" },
];

export const POST_STATUS: Record<PostStatus, string> = {
  rascunho: "Rascunho",
  revisao: "Em revisão",
  publicado: "Publicado",
};

export const LEVELS = ["Sem prática", "Iniciante", "Básico", "Intermediário", "Avançado", "Especialista"];

export const README_SECTIONS: {
  key: "problema" | "dados" | "abordagem" | "tecnologias" | "metodologia" | "resultados" | "aprendizados" | "proximosPassos";
  title: string;
  guide: string[];
}[] = [
  {
    key: "problema",
    title: "Problema",
    guide: ["Qual problema real você está atacando?", "Quem é afetado e por que importa?", "Qual é o escopo (o que fica de fora)?"],
  },
  {
    key: "dados",
    title: "Dados utilizados",
    guide: ["Fonte e licença do dataset (link).", "Volume, período, frequência de amostragem.", "Limitações conhecidas e pré-processamento."],
  },
  {
    key: "abordagem",
    title: "Abordagem",
    guide: ["Ideia central da solução.", "Por que essa abordagem e não outras?", "Baseline usado para comparação."],
  },
  {
    key: "tecnologias",
    title: "Tecnologias",
    guide: ["Linguagens, bibliotecas e ferramentas.", "Infraestrutura (local, cloud, containers)."],
  },
  {
    key: "metodologia",
    title: "Metodologia",
    guide: ["Divisão treino/validação/teste (temporal?).", "Métricas escolhidas e justificativa.", "Como evitar vazamento de dados."],
  },
  {
    key: "resultados",
    title: "Resultados",
    guide: [
      "Apenas números que você mediu e consegue reproduzir.",
      "Informe a métrica, o conjunto avaliado e o baseline.",
      "Se ainda não há resultados, deixe vazio — o README indicará isso.",
    ],
  },
  {
    key: "aprendizados",
    title: "Aprendizados",
    guide: ["O que deu errado e o que você mudou.", "O que você faria diferente."],
  },
  {
    key: "proximosPassos",
    title: "Próximos passos",
    guide: ["Melhorias planejadas.", "Como levar para produção."],
  },
];
