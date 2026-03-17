import "bootstrap/dist/css/bootstrap.min.css";
import * as bootstrap from "bootstrap";
import "./assets/style.css";
import { api } from "./services/api.js";
import { Toast } from "./services/toast.js";

window.bootstrap = bootstrap;

// --- 1. Mapeamento de Elementos do DOM ---
const DOM = {
  tabelaCorpo: document.getElementById("tabela-corpo"),
  btnAbrirNovaCampanha: document.getElementById("btnAbrirNovaCampanha"),
  inputs: {
    campanhaNome: document.getElementById("campanhaNome"),
    campanhaProduto: document.getElementById("campanhaProduto"),
    idCampanhaLog: document.getElementById("idCampanhaLog"),
    logData: document.getElementById("logData"),
    logSpend: document.getElementById("logSpend"),
    logRevenue: document.getElementById("logRevenue"),
    spanIdVisual: document.getElementById("spanIdVisual"),
    editId: document.getElementById("editCampanhaId"),
    editNome: document.getElementById("editCampanhaNome"),
    editProduto: document.getElementById("editCampanhaProduto"),
  },
  buttons: {
    salvarCampanha: document.getElementById("btnSalvarCampanha"),
    salvarLog: document.getElementById("btnSalvarLog"),
    salvarEdicao: document.getElementById("btnSalvarEdicao"),
    confirmarDelete: document.getElementById("btnConfirmarDelete"),
  },
  delete: {
    nomeCampanha: document.getElementById("deleteNomeCampanha"),
  },
  stats: {
    totalSpend: document.getElementById("statsTotalSpend"),
    totalRevenue: document.getElementById("statsTotalRevenue"),
    roi: document.getElementById("statsRoi"),
    tabelaLogs: document.getElementById("tabela-logs-detalhes"),
  },
  modals: {
    log: new bootstrap.Modal(document.getElementById("modalLogCampanha")),
    novaCampanha: new bootstrap.Modal(document.getElementById("modalNovaCampanha")),
    stats: new bootstrap.Modal(document.getElementById("modalStats")),
    editar: new bootstrap.Modal(document.getElementById("modalEditarCampanha")),
    delete: new bootstrap.Modal(document.getElementById("modalConfirmarDelete")),
  },
};

let _idParaDeletar = null;

// Helper: aguarda o modal fechar completamente antes de executar o callback.
// Evita o backdrop ficar preso quando o DOM é re-renderizado
// durante a animação de fechamento do Bootstrap (300ms).
function aoFecharModal(modalEl, callback) {
  modalEl.addEventListener("hidden.bs.modal", async () => {
    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());

    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");

    await callback();
  }, { once: true })
};

// --- 2. Utilitários ---
const Utils = {
  formatarMoeda: (valor) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor),

  calcularROI: (spend, revenue) => {
    if (!spend || spend === 0) return 0;
    return (((revenue - spend) / spend) * 100).toFixed(0);
  },

  setLoading: (btn, loading) => {
    if (loading) {
      btn.disabled = true;
      btn.dataset.textoOriginal = btn.innerText;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Salvando...`;
    } else {
      btn.disabled = false;
      btn.innerText = btn.dataset.textoOriginal || btn.innerText;
    }
  },
};

// --- 3. UI Controller ---
const UI = {
  mostrarSkeleton: () => {
    DOM.tabelaCorpo.innerHTML = Array(6).fill(`
      <tr class="skeleton-row">
        <td><div class="skeleton-cell w-25"></div></td>
        <td><div class="skeleton-cell w-80"></div></td>
        <td><div class="skeleton-cell w-60"></div></td>
        <td><div class="skeleton-cell w-pill"></div></td>
        <td><div class="skeleton-cell w-actions"></div></td>
      </tr>
    `).join("");
  },

  limparTabela: () => { DOM.tabelaCorpo.innerHTML = ""; },

  criarLinhaHTML: (campanha) => {
    const statsSafe = campanha.stats || { roi: 0 };
    const roi = statsSafe.roi;
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
            data-id="${campanha.id}" title="Adicionar Log">📝</button>
          <button class="btn-action btn-view-stats"
            data-id="${campanha.id}" title="Ver Estatísticas">📊</button>
          <button class="btn-action btn-edit"
            data-id="${campanha.id}"
            data-nome="${campanha.name}"
            data-produto="${campanha.product}"
            title="Editar Campanha">✏️</button>
          <button class="btn-action btn-del btn-delete"
            data-id="${campanha.id}"
            data-nome="${campanha.name}"
            title="Excluir Campanha">🗑️</button>
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

    DOM.tabelaCorpo.innerHTML = campanhas.map((c) => UI.criarLinhaHTML(c)).join("");
    DOM.tabelaCorpo.querySelectorAll("[title]").forEach((t) => new bootstrap.Tooltip(t));
  },

  prepararModalDelete: (id, nome) => {
    _idParaDeletar = id;
    DOM.delete.nomeCampanha.innerText = nome;
    DOM.modals.delete.show();
  },

  prepararModalLog: (idCampanha) => {
    DOM.inputs.idCampanhaLog.value = idCampanha;
    DOM.inputs.spanIdVisual.innerText = `#${idCampanha}`;
    DOM.inputs.logData.valueAsDate = new Date();
    DOM.modals.log.show();
  },

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

    DOM.stats.tabelaLogs.innerHTML = [...logs]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((log) => {
        const lucro = log.revenue - log.spend;
        const corLucro = lucro >= 0 ? "text-success" : "text-danger";
        return `
          <tr>
            <td>${new Date(log.date).toLocaleDateString("pt-BR")}</td>
            <td class="text-end text-danger">- ${Utils.formatarMoeda(log.spend)}</td>
            <td class="text-end text-success">+ ${Utils.formatarMoeda(log.revenue)}</td>
            <td class="text-end ${corLucro} fw-bold">${Utils.formatarMoeda(lucro)}</td>
          </tr>
        `;
      })
      .join("");

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
    UI.mostrarSkeleton();

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

      const campanhasOrdenadas = [...campanhasComStats].sort((a, b) => b.id - a.id);
      UI.renderizarDados(campanhasOrdenadas);
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error);
      Toast.error("Não foi possível carregar as campanhas.");
      DOM.tabelaCorpo.innerHTML =
        '<tr><td colspan="5" class="text-center py-4" style="color:var(--red)">Erro ao carregar dados da API.</td></tr>';
    }
  },

  criarCampanha: async () => {
    const nome = DOM.inputs.campanhaNome.value.trim();
    const produto = DOM.inputs.campanhaProduto.value.trim();

    if (!nome || !produto) {
      Toast.warning("Preencha todos os campos.");
      return;
    }

    const btn = DOM.buttons.salvarCampanha;
    Utils.setLoading(btn, true);

    try {
      await api.createCampaign({ name: nome, product: produto });
      UI.limparFormularioCampanha();

      aoFecharModal(document.getElementById("modalNovaCampanha"), async () => {
        Toast.success("Campanha criada com sucesso!");
        await App.carregarTodasCampanhas();
      });

      DOM.modals.novaCampanha.hide();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      Utils.setLoading(btn, false);
    }
  },

  editarCampanha: async () => {
    const id = DOM.inputs.editId.value;
    const nome = DOM.inputs.editNome.value.trim();
    const produto = DOM.inputs.editProduto.value.trim();

    if (!nome || !produto) {
      Toast.warning("Preencha todos os campos.");
      return;
    }

    const btn = DOM.buttons.salvarEdicao;
    Utils.setLoading(btn, true);

    try {
      await api.updateCampaign(id, { name: nome, product: produto });

      aoFecharModal(document.getElementById("modalEditarCampanha"), async () => {
        Toast.success("Campanha atualizada!");
        await App.carregarTodasCampanhas();
      });

      DOM.modals.editar.hide();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      Utils.setLoading(btn, false);
    }
  },

  confirmarDelete: async () => {
    if (!_idParaDeletar) return;

    const btn = DOM.buttons.confirmarDelete;
    Utils.setLoading(btn, true);

    try {
      await api.deleteCampaign(_idParaDeletar);

      aoFecharModal(document.getElementById("modalConfirmarDelete"), async () => {
        Toast.success("Campanha excluída com sucesso.");
        await App.carregarTodasCampanhas();
      });

      DOM.modals.delete.hide();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      Utils.setLoading(btn, false);
      _idParaDeletar = null;
    }
  },

  adicionarLog: async () => {
    const id = DOM.inputs.idCampanhaLog.value;
    const data = DOM.inputs.logData.value;
    const spend = DOM.inputs.logSpend.value;
    const revenue = DOM.inputs.logRevenue.value;

    if (!data || !spend || !revenue) {
      Toast.warning("Preencha a data e os valores.");
      return;
    }

    const btn = DOM.buttons.salvarLog;
    Utils.setLoading(btn, true);

    try {
      await api.addLog(parseInt(id), {
        date: data,
        spend: parseFloat(spend),
        revenue: parseFloat(revenue),
      });

      aoFecharModal(document.getElementById("modalLogCampanha"), async () => {
        Toast.success("Log salvo com sucesso!");
        await App.carregarTodasCampanhas();
      });

      DOM.modals.log.hide();
      UI.limparFormularioLog();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      Utils.setLoading(btn, false);
    }
  },

  verEstatisticas: async (id) => {
    try {
      const logs = await api.getLogs(id);
      UI.preencherModalStats(logs);
    } catch (error) {
      console.error(error);
      Toast.error("Erro ao buscar histórico da campanha.");
    }
  },

  setupEventListeners: () => {
    // Botão "Nova Campanha" controlado 100% pelo JS — sem data-bs-toggle no HTML
      DOM.btnAbrirNovaCampanha.addEventListener("click", () => {
      DOM.modals.novaCampanha.show();
    });

    DOM.tabelaCorpo.addEventListener("click", (e) => {
      const btnLog = e.target.closest(".btn-add-log");
      if (btnLog) return UI.prepararModalLog(btnLog.dataset.id);

      const btnStats = e.target.closest(".btn-view-stats");
      if (btnStats) return App.verEstatisticas(btnStats.dataset.id);

      const btnEdit = e.target.closest(".btn-edit");
      if (btnEdit) return UI.prepararModalEdicao(
        btnEdit.dataset.id,
        btnEdit.dataset.nome,
        btnEdit.dataset.produto
      );

      const btnDelete = e.target.closest(".btn-delete");
      if (btnDelete) return UI.prepararModalDelete(
        btnDelete.dataset.id,
        btnDelete.dataset.nome
      );
    });

    DOM.buttons.salvarCampanha.addEventListener("click", App.criarCampanha);
    DOM.buttons.salvarLog.addEventListener("click", App.adicionarLog);
    DOM.buttons.salvarEdicao.addEventListener("click", App.editarCampanha);
    DOM.buttons.confirmarDelete.addEventListener("click", App.confirmarDelete);
  },
};

document.addEventListener("DOMContentLoaded", App.init);