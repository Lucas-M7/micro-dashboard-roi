import "bootstrap/dist/css/bootstrap.min.css";
import * as bootstrap from "bootstrap";
import "./assets/style.css";
import { api } from "./services/api.js";

window.bootstrap = bootstrap;

// --- 1. Mapeamento de Elementos do DOM (Cache) ---
const DOM = {
  tabelaCorpo: document.getElementById("tabela-corpo"),
  inputs: {
    campanhaNome: document.getElementById("campanhaNome"),
    campanhaProduto: document.getElementById("campanhaProduto"),
    idCampanhaLog: document.getElementById("idCampanhaLog"),
    logData: document.getElementById("logData"),
    logSpend: document.getElementById("logSpend"),
    logRevenue: document.getElementById("logRevenue"),
    spanIdVisual: document.getElementById("spanIdVisual"),
  },
  buttons: {
    salvarCampanha: document.getElementById("btnSalvarCampanha"),
    salvarLog: document.getElementById("btnSalvarLog"),
  },
  // Elementos do Modal de Estatísticas
  stats: {
    totalSpend: document.getElementById("statsTotalSpend"),
    totalRevenue: document.getElementById("statsTotalRevenue"),
    roi: document.getElementById("statsRoi"),
    tabelaLogs: document.getElementById("tabela-logs-detalhes"),
  },
  modals: {
    log: new bootstrap.Modal(document.getElementById("modalLogCampanha")),
    novaCampanha: new bootstrap.Modal(
      document.getElementById("modalNovaCampanha")
    ),
    stats: new bootstrap.Modal(document.getElementById("modalStats")),
  },
};

// --- 2. Utilitários (Funções Puras - Matemática e Formatação) ---
const Utils = {
  formatarMoeda: (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  },

  calcularROI: (spend, revenue) => {
    if (!spend || spend === 0) return 0;
    return (((revenue - spend) / spend) * 100).toFixed(0);
  },
};

// --- 3. UI Controller (Manipulação da Tela) ---
const UI = {
  limparTabela: () => {
    DOM.tabelaCorpo.innerHTML = "";
  },

  criarLinhaHTML: (campanha) => {
    // Se stats vier null (campanha nova sem logs), usa valores padrão
    const statsSafe = campanha.stats || { roi: 0 };
    const roi = statsSafe.roi;
    const corBadge =
      roi >= 0 ? "text-success bg-success" : "text-danger bg-danger";

    return `
            <tr>
                <td><span class="text-muted">#${campanha.id}</span></td>
                <td class="fw-bold">${campanha.name}</td>
                <td>${campanha.product}</td>
                <td class="text-end">
                    <span class="badge ${corBadge} bg-opacity-10 px-3 py-2 rounded-pill">
                        ${roi}%
                    </span>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-light me-2 btn-add-log" data-id="${campanha.id}" title="Adicionar Log">
                        📝
                    </button>
                    <button class="btn btn-sm btn-outline-info btn-view-stats" data-id="${campanha.id}" title="Ver Estatísticas">
                        📊
                    </button>
                </td>
            </tr>
        `;
  },

  renderizarDados: (campanhas) => {
    UI.limparTabela();

    if (campanhas.length === 0) {
      DOM.tabelaCorpo.innerHTML =
        '<tr><td colspan="5" class="text-center text-muted py-4">Nenhuma campanha encontrada.</td></tr>';
      return;
    }

    // Renderiza linhas usando map e join (mais performático)
    const linhasHTML = campanhas
      .map((campanha) => UI.criarLinhaHTML(campanha))
      .join("");
    DOM.tabelaCorpo.innerHTML = linhasHTML;

    // Inicializa Tooltips apenas nos novos elementos
    const tooltipTriggerList = DOM.tabelaCorpo.querySelectorAll("[title]");
    [...tooltipTriggerList].map((t) => new bootstrap.Tooltip(t));
  },

  // --- Funções dos Modais (Reaproveitadas) ---
  prepararModalLog: (idCampanha) => {
    DOM.inputs.idCampanhaLog.value = idCampanha;
    DOM.inputs.spanIdVisual.innerText = `#${idCampanha}`;
    DOM.inputs.logData.valueAsDate = new Date();
    DOM.modals.log.show();
  },

  limparFormularioLog: () => {
    DOM.inputs.logSpend.value = "";
    DOM.inputs.logRevenue.value = "";
  },

  limparFormularioCampanha: () => {
    DOM.inputs.campanhaNome.value = "";
    DOM.inputs.campanhaProduto.value = "";
  },

  // Função para preencher o modal de estatísticas (Corrigida com validação de array)
  preencherModalStats: (logs) => {
    DOM.stats.tabelaLogs.innerHTML = "";

    // BLINDAGEM: Verifica se 'logs' existe E se é realmente um Array
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      DOM.stats.tabelaLogs.innerHTML =
        "<tr><td colspan='4' class='text-center text-muted py-3'>Nenhum registro encontrado.</td></tr>";
      DOM.stats.totalSpend.innerText = Utils.formatarMoeda(0);
      DOM.stats.totalRevenue.innerText = Utils.formatarMoeda(0);
      DOM.stats.roi.innerText = "0%";
      DOM.modals.stats.show(); // Mostra mesmo vazio
      return;
    }

    // Cálculos Totais do Modal
    const totalSpend = logs.reduce((acc, l) => acc + l.spend, 0);
    const totalRevenue = logs.reduce((acc, l) => acc + l.revenue, 0);
    const roi = Utils.calcularROI(totalSpend, totalRevenue);

    // Atualiza Cabeçalho do Modal
    DOM.stats.totalSpend.innerText = Utils.formatarMoeda(totalSpend);
    DOM.stats.totalRevenue.innerText = Utils.formatarMoeda(totalRevenue);
    DOM.stats.roi.innerText = `${roi}%`;

    // Ordenar logs por data (mais recente primeiro) e renderizar
    const linhasHTML = [...logs]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((log) => {
        const lucro = log.revenue - log.spend;
        const corLucro = lucro >= 0 ? "text-success" : "text-danger";
        const dataFormatada = new Date(log.date).toLocaleDateString("pt-BR");
        return `
                    <tr>
                        <td>${dataFormatada}</td>
                        <td class="text-end text-danger">- ${Utils.formatarMoeda(
                          log.spend
                        )}</td>
                        <td class="text-end text-success">+ ${Utils.formatarMoeda(
                          log.revenue
                        )}</td>
                        <td class="text-end ${corLucro} fw-bold">${Utils.formatarMoeda(
          lucro
        )}</td>
                    </tr>
                `;
      })
      .join("");

    DOM.stats.tabelaLogs.innerHTML = linhasHTML;
    DOM.modals.stats.show();
  },
};

// --- 4. App Logic (Orquestração e Eventos) ---
const App = {
  init: () => {
    App.setupEventListeners();
    App.carregarTodasCampanhas();
  },

  // Lógica principal desta página: Buscar TUDO
  carregarTodasCampanhas: async () => {
    try {
      // 1. Busca a lista base de campanhas
      const campanhasBase = await api.getCampaigns();

      // 2. Enriquece cada campanha chamando o endpoint de /stats
      // (Necessário para mostrar o ROI Global na tabela principal)
      const campanhasComStats = await Promise.all(
        campanhasBase.map(async (campanha) => {
          const stats = await api.getStats(campanha.id);
          // Se stats for null, usa um objeto padrão para não quebrar a UI
          return {
            ...campanha,
            stats: stats || { roi: 0, totalSpend: 0, totalRevenue: 0 },
          };
        })
      );

      // 3. Ordena por ID decrescente (mais novas primeiro)
      const campanhasOrdenadas = [...campanhasComStats].sort(
        (a, b) => b.id - a.id
      );

      UI.renderizarDados(campanhasOrdenadas);

      console.log("Lista de todas as campanhas carregada.");
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error);
      DOM.tabelaCorpo.innerHTML =
        '<tr><td colspan="5" class="text-center text-danger py-4">Erro ao carregar dados da API.</td></tr>';
    }
  },

  // --- Ações dos Botões (Reaproveitadas) ---
  criarCampanha: async () => {
    const nome = DOM.inputs.campanhaNome.value;
    const produto = DOM.inputs.campanhaProduto.value;

    if (!nome || !produto) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      await api.createCampaign({ name: nome, product: produto });
      UI.limparFormularioCampanha();
      DOM.modals.novaCampanha.hide();
      // Recarrega a lista após criar
      await App.carregarTodasCampanhas();
    } catch (error) {
      alert(error.message);
    }
  },

  adicionarLog: async () => {
    const id = DOM.inputs.idCampanhaLog.value;
    const data = DOM.inputs.logData.value;
    const spend = DOM.inputs.logSpend.value;
    const revenue = DOM.inputs.logRevenue.value;

    if (!data || !spend || !revenue) {
      alert("Preencha a data e os valores!");
      return;
    }

    try {
      await api.addLog(parseInt(id), {
        date: data,
        spend: parseFloat(spend),
        revenue: parseFloat(revenue),
      });
      alert("Log salvo com sucesso!");
      DOM.modals.log.hide();
      UI.limparFormularioLog();
      // Recarrega a lista para atualizar o ROI
      await App.carregarTodasCampanhas();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar log.");
    }
  },

  verEstatisticas: async (id) => {
    try {
      const logs = await api.getLogs(id);
      // Chama a função da UI que preenche e abre o modal
      UI.preencherModalStats(logs);
    } catch (error) {
      console.error(error);
      alert("Erro ao buscar histórico da campanha.");
    }
  },

  setupEventListeners: () => {
    // Event Delegation para botões da tabela
    DOM.tabelaCorpo.addEventListener("click", (e) => {
      // Botão 📝 (Adicionar Log)
      const btnLog = e.target.closest(".btn-add-log");
      if (btnLog) UI.prepararModalLog(btnLog.dataset.id);

      // Botão 📊 (Ver Estatísticas)
      const btnStats = e.target.closest(".btn-view-stats");
      if (btnStats) App.verEstatisticas(btnStats.dataset.id);
    });

    DOM.buttons.salvarCampanha.addEventListener("click", App.criarCampanha);
    DOM.buttons.salvarLog.addEventListener("click", App.adicionarLog);
  },
};

// Iniciar Aplicação quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", App.init);
