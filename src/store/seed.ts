/**
 * Dados de EXEMPLO (fictícios) carregados no primeiro uso.
 *
 * Uma pessoa estudante fictícia com 4 projetos planejados e um roteiro de
 * competências genérico, só para demonstrar o app. Nenhuma etapa concluída,
 * nenhum resultado, nenhuma métrica. Apague ou edite tudo em Configurações.
 */
import type { AppData, CareerPlan, InterviewPrep, Project, ReadmeDraft, Skill, Stage } from "../types";
import { SCHEMA_VERSION } from "../types";
import { localIso, nowIso, uid } from "../lib/utils";

export const emptyReadme = (): ReadmeDraft => ({
  problema: "",
  dados: "",
  abordagem: "",
  tecnologias: "",
  metodologia: "",
  resultados: "",
  aprendizados: "",
  proximosPassos: "",
  resultadosVerificados: false,
});

export const emptyInterview = (): InterviewPrep => ({
  pitch: "",
  contexto: "",
  desafio: "",
  acao: "",
  resultado: "",
  decisoes: "",
  perguntas: "",
});

export function newProject(partial: Partial<Project> = {}): Project {
  const now = nowIso();
  const stage: Stage = partial.stage ?? "ideias";
  return {
    id: uid("p"),
    name: "Novo projeto",
    description: "",
    objective: "",
    area: "",
    technologies: [],
    stage,
    priority: "media",
    steps: [],
    dates: [],
    links: [],
    files: [],
    notes: "",
    readme: emptyReadme(),
    interview: emptyInterview(),
    stageHistory: [{ stage, at: now }],
    deliverables: [],
    order: Date.now(),
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

const steps = (titles: string[]) => titles.map((title) => ({ id: uid("st"), title, done: false }));

/** Data ISO daqui a N semanas (estimativa do sequenciamento do roadmap). */
const inWeeks = (w: number) => {
  const d = new Date();
  d.setDate(d.getDate() + w * 7);
  return localIso(d);
};

const README_RULE =
  "Formato do README: problema → dado → abordagem → resultado → aprendizado. Não incluir métricas que não tenham sido realmente medidas.";

function seedProjects(): Project[] {
  return [
    newProject({
      id: "psolar",
      name: "Previsão de geração em usina solar",
      area: "Energia · Séries temporais · Fase 1",
      stage: "planejamento",
      priority: "alta",
      roadmapPhase: 1,
      startDate: inWeeks(0),
      targetDate: inWeeks(4),
      description:
        "Prever a geração de energia de uma usina fotovoltaica e sinalizar quedas de desempenho a partir de dados históricos públicos.",
      objective:
        "Projeto de entrada no portfólio: problema concreto, dados públicos e resultado fácil de explicar em entrevista.",
      technologies: ["Python", "Pandas", "SQL", "Séries temporais", "XGBoost", "Git"],
      deliverables: ["Repositório GitHub com README", "Post no LinkedIn"],
      steps: steps([
        "Estudo: SQL (item 1 do roteiro)",
        "Estudo: validação estatística de modelos (item 2)",
        "Escolher o dataset público de geração fotovoltaica",
        "Carregar os dados em um banco SQL e explorar com consultas",
        "Decomposição da série e atributos temporais",
        "Modelo de previsão e comparação com uma linha de base",
        "Validação com divisão temporal",
        "README (problema → dado → abordagem → resultado → aprendizado)",
        "Publicar no GitHub e escrever post no LinkedIn",
      ]),
      dates: [{ id: uid("d"), label: "Fim da fase 1 do roteiro (estimativa)", date: inWeeks(4) }],
      notes: "Dado sugerido: dataset público \"Solar Power Generation Data\" (Kaggle).\n\n" + README_RULE,
    }),
    newProject({
      id: "ppdm",
      name: "Manutenção preditiva com dataset público",
      area: "Indústria · Prognóstico (RUL) · Fase 2",
      stage: "planejamento",
      priority: "alta",
      roadmapPhase: 2,
      startDate: inWeeks(4),
      targetDate: inWeeks(8),
      description:
        "Prever falha iminente de equipamento ou estimar a vida útil restante (RUL) com um dataset público bem documentado.",
      objective: "Mostrar classificação de falha e regressão de RUL em dados industriais de referência.",
      technologies: ["Python", "Pandas", "Scikit-learn", "Séries temporais", "PyTorch", "Git"],
      deliverables: ["Repositório GitHub com README", "Dashboard simples (opcional)"],
      steps: steps([
        "Escolher dataset: NASA C-MAPSS ou AI4I 2020 (UCI)",
        "Análise exploratória e definição do alvo",
        "Classificação de falha (linha de base)",
        "Regressão de RUL",
        "Validação estatística dos modelos",
        "Versão com LSTM em PyTorch (opcional)",
        "README e publicação no GitHub",
      ]),
      dates: [{ id: uid("d"), label: "Fim da fase 2 do roteiro (estimativa)", date: inWeeks(8) }],
      notes: "Dados sugeridos: NASA C-MAPSS ou AI4I 2020 Predictive Maintenance Dataset (UCI).\n\n" + README_RULE,
    }),
    newProject({
      id: "ptuning",
      name: "Sintonia automática de PID com otimização",
      area: "Controle · Otimização · Fase 3",
      stage: "ideias",
      priority: "media",
      roadmapPhase: 3,
      startDate: inWeeks(8),
      targetDate: inWeeks(12),
      description: "Ajustar automaticamente os ganhos de um controlador PID simulado usando otimização bayesiana.",
      objective: "Unir teoria de controle e ML numa comparação justa entre métodos de sintonia.",
      technologies: ["Python", "SciPy", "python-control", "Otimização bayesiana", "Git"],
      deliverables: ["Repositório GitHub com README"],
      steps: steps([
        "Modelar uma planta de 2ª ordem em simulação",
        "Definir a função de custo (IAE, overshoot, esforço de controle)",
        "Sintonia por grid search (referência)",
        "Sintonia por otimização bayesiana",
        "Comparação estatística entre as configurações",
        "Documentar e publicar",
      ]),
      dates: [{ id: uid("d"), label: "Fim da fase 3 do roteiro (estimativa)", date: inWeeks(12) }],
      notes: "Toda a planta é simulada; deixar isso explícito no README.\n\n" + README_RULE,
    }),
    newProject({
      id: "panomaly",
      name: "Detecção de anomalia em rede industrial simulada",
      area: "Automação + IA · Fase 4",
      stage: "ideias",
      priority: "media",
      roadmapPhase: 4,
      startDate: inWeeks(12),
      targetDate: inWeeks(16),
      description: "Simular tráfego Modbus TCP e treinar um modelo que detecte comportamentos anômalos.",
      objective: "Projeto mais avançado do portfólio, juntando protocolo industrial e detecção de anomalia.",
      technologies: ["Python", "pymodbus", "Modbus TCP", "Scikit-learn", "Isolation Forest", "Git"],
      deliverables: ["Repositório GitHub com README"],
      steps: steps([
        "Estudo: protocolos industriais (item 7)",
        "Gerar tráfego Modbus simulado com pymodbus",
        "Injetar cenários anômalos documentados",
        "Atributos sobre os pacotes de rede",
        "Detecção com Isolation Forest",
        "Análise de falsos positivos",
        "README e publicação",
      ]),
      dates: [{ id: uid("d"), label: "Fim da fase 4 do roteiro (estimativa)", date: inWeeks(16) }],
      notes: "Toda a rede é simulada; deixar isso explícito no README.\n\n" + README_RULE,
    }),
  ].map((p, i) => ({ ...p, order: i }));
}

type SkillSeed = Omit<Skill, "links" | "history" | "notes" | "description"> & { feeds: [string, string][]; notes?: string; description?: string };
const mk = ({ feeds, ...s }: SkillSeed): Skill => ({
  description: "",
  notes: "",
  ...s,
  links: feeds.map(([projectId, evidence]) => ({ projectId, status: "planejada" as const, evidence })),
  history: [],
});

const ALL = ["psolar", "ppdm", "ptuning", "panomaly"];

/**
 * Roteiro de exemplo com 8 competências, na ordem de estudo.
 * 0 = sem prática · 1 iniciante · 2 básico · 3 intermediário · 4 avançado · 5 especialista
 */
function seedSkills(): Skill[] {
  const roadmap: Skill[] = [
    mk({
      id: "ssql", name: "SQL", category: "Dados", level: 1, target: 3, roadmapOrder: 1, roadmapPhase: 1,
      content: "SELECT, WHERE, JOIN, GROUP BY, subconsultas e window functions básicas.",
      why: "Pré-requisito para extrair dados de qualquer sistema antes de aplicar ML.",
      doneCriterion: "Escrever uma consulta que filtra, agrupa e junta duas tabelas sem consultar referência.",
      feeds: [["psolar", "Armazenar e consultar dados históricos."], ["ppdm", "Organizar dados dos sensores."]],
    }),
    mk({
      id: "sstats", name: "Validação estatística", category: "Ciência de dados", level: 1, target: 3, roadmapOrder: 2, roadmapPhase: 1,
      content: "Divisão treino/teste, validação cruzada, overfitting, métricas de regressão e classificação.",
      why: "Diferencia \"fiz um modelo\" de \"sei defender o modelo\".",
      doneCriterion: "Escolher a métrica certa para um problema e mostrar que o modelo não está sobreajustado.",
      feeds: ALL.map((id) => [id, "Validação dos resultados do projeto."] as [string, string]),
    }),
    mk({
      id: "storch", name: "PyTorch", category: "Machine Learning", level: 0, target: 3, roadmapOrder: 3, roadmapPhase: 3,
      content: "Tensores, redes feedforward, treino e avaliação, LSTM simples.",
      why: "Framework de deep learning mais pedido nas vagas de ML.",
      doneCriterion: "Montar, treinar e avaliar uma rede simples do zero.",
      feeds: [["ppdm", "Versão com LSTM."]],
    }),
    mk({
      id: "sts", name: "Séries temporais", category: "Ciência de dados", level: 1, target: 3, roadmapOrder: 4, roadmapPhase: 2,
      content: "Decomposição, ARIMA/SARIMA, Holt-Winters, validação temporal.",
      why: "Base de previsão e manutenção preditiva.",
      doneCriterion: "Decompor uma série e treinar um modelo de previsão com avaliação de erro.",
      feeds: [["psolar", "Núcleo técnico do projeto."], ["ppdm", "Atributos temporais."]],
    }),
    mk({
      id: "sgit", name: "Git", category: "Engenharia de software", level: 1, target: 3, roadmapOrder: 5, roadmapPhase: 2,
      content: "Commits, branches, .gitignore e um bom README.",
      why: "Torna os projetos rastreáveis e apresentáveis.",
      doneCriterion: "Versionar um projeto do zero e publicar com README completo.",
      feeds: ALL.map((id) => [id, "Publicação do repositório."] as [string, string]),
    }),
    mk({
      id: "scloud", name: "Cloud (Azure / Databricks)", category: "Infraestrutura", level: 0, target: 2, roadmapOrder: 6, roadmapPhase: 4,
      content: "Notebook em nuvem, armazenamento e pipeline de dados simples.",
      why: "Aparece com frequência em vagas de dados.",
      doneCriterion: "Rodar e explicar um notebook simples numa plataforma de nuvem.",
      feeds: [],
    }),
    mk({
      id: "sind", name: "Protocolos industriais", category: "Automação", level: 1, target: 3, roadmapOrder: 7, roadmapPhase: 4,
      content: "Modbus RTU/TCP, conceitos de OPC-UA, indicadores MTTR, MTBF e OEE.",
      why: "Conecta dados de chão de fábrica com análise.",
      doneCriterion: "Explicar como um dado sai de um CLP até uma tabela analisável.",
      feeds: [["panomaly", "Núcleo do projeto."]],
    }),
    mk({
      id: "smlops", name: "MLOps", category: "Machine Learning", level: 0, target: 2, roadmapOrder: 8, roadmapPhase: 4,
      content: "API para servir modelo, monitoramento de drift, versionamento de modelos.",
      why: "Leva o modelo do notebook para produção.",
      doneCriterion: "Subir uma API simples servindo um modelo treinado.",
      feeds: [],
    }),
  ];

  const base = (id: string, name: string, level: number, description: string): Skill =>
    mk({ id, name, category: "Base", level, target: Math.max(level, 3), feeds: [], description, notes: "Nível de exemplo." });
  return [
    ...roadmap,
    base("spython", "Python (Pandas, NumPy)", 2, "Manipulação de dados e scripts."),
    base("sml", "ML clássico (Scikit-learn)", 1, "Modelos de classificação e regressão."),
    base("sctrl", "Engenharia de controle", 2, "Modelagem e controle PID."),
    base("smatlab", "MATLAB/Simulink", 2, "Simulação e modelagem."),
  ];
}

export const defaultCareer = (): CareerPlan => ({
  currentPhase: 1,
  phaseTitle: "Fase 1 — Primeiros projetos de portfólio",
  focus: "Exemplo: publicar 2 projetos completos no GitHub, com README e resultados reprodutíveis, antes de buscar o primeiro estágio.",
  targetRoles: ["Estágio em Ciência de Dados", "Estágio em Machine Learning", "Analytics industrial"],
  phase2Options: [
    { title: "Opção A — Machine Learning", note: "Exemplo: aprofundar em deep learning e MLOps." },
    { title: "Opção B — Engenharia de dados", note: "Exemplo: pipelines, bancos de dados e cloud." },
  ],
  rules: [
    "Todo estudo deve alimentar um projeto do portfólio.",
    "Nunca adicionar métricas de resultado que não foram realmente medidas.",
  ],
});

export function seedData(): AppData {
  return {
    version: SCHEMA_VERSION,
    projects: seedProjects(),
    skills: seedSkills(),
    jobs: [],
    posts: [],
    settings: {
      theme: "dark",
      ownerName: "Visitante",
      headline: "Dados de exemplo · edite em Configurações",
      githubUser: "",
      linkedinUrl: "",
      career: defaultCareer(),
    },
  };
}
