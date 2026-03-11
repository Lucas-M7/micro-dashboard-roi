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
    // Inputs do modal de edição
    editId: document.getElementById("editCampanhaId"),
    editNome: document.getElementById("editCampanhaNome"),
    editProduto: document.getElementById("editCampanhaProduto"),
  },
  buttons: {
    salvarCampanha: document.getElementById("btnSalvarCampanha"),
    salvarLog: document.getElementById("btnSalvarLog"),
    salvarEdicao: document.getElementById("btnSalvarEdicao"),
  },
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
    editar: new bootstrap.Modal(document.getElementById("modalEditarCampanha")),
  },
};

// --- 2. Utilitários ---
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

// --- 3. UI Controller ---
const UI = {
  limparTabela: () => {
    DOM.tabelaCorpo.innerHTML = "";
  },

  criarLinhaHTML: (campanha) => {
    const statsSafe = campanha.stats || { roi: 0 };
    const roi = statsSafe.roi;

    // ROI pill com classe semântica (estilo vem do style.css)
    const roiClass = roi > 0 ? "positive" : roi < 0 ? "negative" : "zero";
    const roiSinal = roi > 0 ? "↑" : roi < 0 ? "↓" : "—";

    return `
      <tr>
        <td><span class="text-secondary">#${campanha.id}</span></td>
        <td class="fw-bold">${campanha.name}</td>
        <td>${campanha.product}</td>
        <td class="text-end">
          <span class="roi-pill ${roiClass}">${roiSinal} ${roi}%</span>
        </td>
        <td class="text-end">
          <button class="btn-action btn-add-log"
            data-id="${campanha.id}" title="Adicionar Log">
            📝
          </button>
          <button class="btn-action btn-view-stats"
            data-id="${campanha.id}" title="Ver Estatísticas">
            📊
          </button>
          <button class="btn-action btn-edit"
            data-id="${campanha.id}"
            data-nome="${campanha.name}"
            data-produto="${campanha.product}"
            title="Editar Campanha">
            ✏️
          </button>
          <button class="btn-action btn-del btn-delete"
            data-id="${campanha.id}" title="Excluir Campanha">
            🗑️
          </button>
        </td>
      </tr>
    `;
  },

  renderizarDados: (campanhas) => {
    UI.limparTabela();

    if (campanhas.length === 0) {
      DOM.tabelaCorpo.innerHTML =
        '<tr><td colspan="5" class="text-center py-4" style="color:var(--text-3)">Nenhuma campanha encontrada.</td></tr>';
      return;
    }

    DOM.tabelaCorpo.innerHTML = campanhas
      .map((c) => UI.criarLinhaHTML(c))
      .join("");

    const tooltipTriggerList = DOM.tabelaCorpo.querySelectorAll("[title]");
    [...tooltipTriggerList].map((t) => new bootstrap.Tooltip(t));
  },

  prepararModalLog: (idCampanha) => {
    DOM.inputs.idCampanhaLog.value = idCampanha;
    DOM.inputs.spanIdVisual.innerText = `#${idCampanha}`;
    DOM.inputs.logData.valueAsDate = new Date();
    DOM.modals.log.show();
  },

  // Pré-preenche o modal de edição com os dados atuais da campanha
  prepararModalEdicao: (id, nome, produto) => {
    DOM.inputs.editId.value = id;
    DOM.inputs.editNome.value = nome;
    DOM.inputs.editProduto.value = produto;
    DOM.modals.editar.show();
  },

  limparFormularioLog: () => {
    DOM.inputs.logSpend.value = "";
    DOM.inputs.logRevenue.value = "";
  },

  limparFormularioCampanha: () => {
    DOM.inputs.campanhaNome.value = "";
    DOM.inputs.campanhaProduto.value = "";
  },

  preencherModalStats: (logs) => {
    DOM.stats.tabelaLogs.innerHTML = "";

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      DOM.stats.tabelaLogs.innerHTML =
        "<tr><td colspan='4' class='text-center py-3' style='color:var(--text-3)'>Nenhum registro encontrado.</td></tr>";
      DOM.stats.totalSpend.innerText = Utils.formatarMoeda(0);
      DOM.stats.totalRevenue.innerText = Utils.formatarMoeda(0);
      DOM.stats.roi.innerText = "0%";
      DOM.modals.stats.show();
      return;
    }

    const totalSpend = logs.reduce((acc, l) => acc + l.spend, 0);
    const totalRevenue = logs.reduce((acc, l) => acc + l.revenue, 0);
    const roi = Utils.calcularROI(totalSpend, totalRevenue);

    DOM.stats.totalSpend.innerText = Utils.formatarMoeda(totalSpend);
    DOM.stats.totalRevenue.innerText = Utils.formatarMoeda(totalRevenue);
    DOM.stats.roi.innerText = `${roi}%`;

    const linhasHTML = [...logs]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((log) => {
        const lucro = log.revenue - log.spend;
        const corLucro = lucro >= 0 ? "text-success" : "text-danger";
        const dataFormatada = new Date(log.date).toLocaleDateString("pt-BR");
        return `
          <tr>
            <td>${dataFormatada}</td>
            <td class="text-end text-danger">- ${Utils.formatarMoeda(log.spend)}</td>
            <td class="text-end text-success">+ ${Utils.formatarMoeda(log.revenue)}</td>
            <td class="text-end ${corLucro} fw-bold">${Utils.formatarMoeda(lucro)}</td>
          </tr>
        `;
      })
      .join("");

    DOM.stats.tabelaLogs.innerHTML = linhasHTML;
    DOM.modals.stats.show();
  },
};

// --- 4. App Logic ---
const App = {
  init: () => {
    App.setupEventListeners();
    App.carregarTodasCampanhas();
  },

  carregarTodasCampanhas: async () => {
    try {
      const campanhasBase = await api.getCampaigns();

      const campanhasComStats = await Promise.all(
        campanhasBase.map(async (campanha) => {
          const stats = await api.getStats(campanha.id);
          return {
            ...campanha,
            stats: stats || { roi: 0, totalSpend: 0, totalRevenue: 0 },
          };
        })
      );

      const campanhasOrdenadas = [...campanhasComStats].sort(
        (a, b) => b.id - a.id
      );

      UI.renderizarDados(campanhasOrdenadas);
      console.log("Lista de campanhas carregada.");
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error);
      DOM.tabelaCorpo.innerHTML =
        '<tr><td colspan="5" class="text-center py-4" style="color:var(--red)">Erro ao carregar dados da API.</td></tr>';
    }
  },

  criarCampanha: async () => {
    const nome = DOM.inputs.campanhaNome.value.trim();
    const produto = DOM.inputs.campanhaProduto.value.trim();

    if (!nome || !produto) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      await api.createCampaign({ name: nome, product: produto });
      UI.limparFormularioCampanha();
      DOM.modals.novaCampanha.hide();
      await App.carregarTodasCampanhas();
    } catch (error) {
      alert(error.message);
    }
  },

  // NOVO: lê os inputs do modal de edição e chama o PUT
  editarCampanha: async () => {
    const id = DOM.inputs.editId.value;
    const nome = DOM.inputs.editNome.value.trim();
    const produto = DOM.inputs.editProduto.value.trim();

    if (!nome || !produto) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      await api.updateCampaign(id, { name: nome, product: produto });
      DOM.modals.editar.hide();
      await App.carregarTodasCampanhas();
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar campanha.");
    }
  },

  deletarCampanha: async (id) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir a campanha #${id}? Essa ação não pode ser desfeita.`
      )
    )
      return;

    try {
      await api.deleteCampaign(id);
      await App.carregarTodasCampanhas();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir campanha.");
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
      await App.carregarTodasCampanhas();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar log.");
    }
  },

  verEstatisticas: async (id) => {
    try {
      const logs = await api.getLogs(id);
      UI.preencherModalStats(logs);
    } catch (error) {
      console.error(error);
      alert("Erro ao buscar histórico da campanha.");
    }
  },

  setupEventListeners: () => {
    // Event delegation — um único listener para todos os botões da tabela
    DOM.tabelaCorpo.addEventListener("click", (e) => {
      const btnLog = e.target.closest(".btn-add-log");
      if (btnLog) return UI.prepararModalLog(btnLog.dataset.id);

      const btnStats = e.target.closest(".btn-view-stats");
      if (btnStats) return App.verEstatisticas(btnStats.dataset.id);

      // NOVO: captura dados via data-attributes para evitar re-fetch
      const btnEdit = e.target.closest(".btn-edit");
      if (btnEdit) {
        return UI.prepararModalEdicao(
          btnEdit.dataset.id,
          btnEdit.dataset.nome,
          btnEdit.dataset.produto
        );
      }

      const btnDelete = e.target.closest(".btn-delete");
      if (btnDelete) return App.deletarCampanha(btnDelete.dataset.id);
    });

    DOM.buttons.salvarCampanha.addEventListener("click", App.criarCampanha);
    DOM.buttons.salvarLog.addEventListener("click", App.adicionarLog);
    DOM.buttons.salvarEdicao.addEventListener("click", App.editarCampanha);
  },
};

document.addEventListener("DOMContentLoaded", App.init);