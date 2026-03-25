import "bootstrap/dist/css/bootstrap.min.css";
import * as bootstrap from "bootstrap";
import "./assets/style.css";
import { api } from "./services/api.js";
import { Toast } from "./services/toast.js";
import { RoiChart } from "./services/chart.js";

window.bootstrap = bootstrap;

// --- 1. Mapeamento de Elementos do DOM ---
const DOM = {
  tableBody: document.getElementById("table-body"),
  openNewCampaignBtn: document.getElementById("btnOpenNewCampaign"),
  inputs: {
    campaignName: document.getElementById("inputCampaignName"),
    campaignProduct: document.getElementById("inputCampaignProduct"),
    logCampaignId: document.getElementById("inputLogCampaignId"),
    logDate: document.getElementById("inputLogDate"),
    logSpend: document.getElementById("inputLogSpend"),
    logRevenue: document.getElementById("inputLogRevenue"),
    logCampaignLabel: document.getElementById("labelLogCampaign"),
    editId: document.getElementById("inputEditId"),
    editName: document.getElementById("inputEditName"),
    editProduct: document.getElementById("inputEditProduct"),
  },
  buttons: {
    saveCampaign: document.getElementById("btnSaveCampaign"),
    saveLog: document.getElementById("btnSaveLog"),
    saveEdit: document.getElementById("btnSaveEdit"),
    confirmDelete: document.getElementById("btnConfirmDelete"),
  },
  delete: {
    campaignName: document.getElementById("labelDeleteCampaignName"),
  },
  stats: {
    totalSpend: document.getElementById("statsTotalSpend"),
    totalRevenue: document.getElementById("statsTotalRevenue"),
    roi: document.getElementById("statsRoi"),
    logsTable: document.getElementById("statsLogsTableBody"),
    canvas: document.getElementById("roiChart"),
  },
  modals: {
    log: new bootstrap.Modal(document.getElementById("modalAddLog")),
    newCampaign: new bootstrap.Modal(document.getElementById("modalNewCampaign")),
    stats: new bootstrap.Modal(document.getElementById("modalStats")),
    edit: new bootstrap.Modal(document.getElementById("modalEditCampaign")),
    delete: new bootstrap.Modal(document.getElementById("modalConfirmDelete")),
  },
};

let _pendingDeleteId = null;

// Helper: aguarda o modal fechar completamente antes de executar o callback.
// Evita o backdrop ficar preso quando o DOM é re-renderizado
// durante a animação de fechamento do Bootstrap (300ms).
function onModalClose(modalEl, callback) {
  modalEl.addEventListener("hidden.bs.modal", async () => {
    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");
    await callback();
  }, { once: true });
}

// --- 2. Utilitários ---
const Utils = {
  formatCurrency: (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value),

  calculateRoi: (spend, revenue) => {
    if (!spend || spend === 0) return 0;
    return (((revenue - spend) / spend) * 100).toFixed(0);
  },

  setLoading: (btn, loading) => {
    if (loading) {
      btn.disabled = true;
      btn.dataset.originalText = btn.innerText;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Salvando...`;
    } else {
      btn.disabled = false;
      btn.innerText = btn.dataset.originalText || btn.innerText;
    }
  },
};

// --- 3. UI Controller ---
const UI = {
  showSkeleton: () => {
    DOM.tableBody.innerHTML = Array(6).fill(`
      <tr class="skeleton-row">
        <td><div class="skeleton-cell w-25"></div></td>
        <td><div class="skeleton-cell w-80"></div></td>
        <td><div class="skeleton-cell w-60"></div></td>
        <td><div class="skeleton-cell w-pill"></div></td>
        <td><div class="skeleton-cell w-actions"></div></td>
      </tr>
    `).join("")
  },

  clearTable: () => { DOM.tableBody.innerHTML = ""; },

  buildRowHtml: (campaign) => {
    const safeStats = campaign.stats || { roi: 0 };
    const roi      = safeStats.roi;
    const roiClass = roi > 0 ? "positive" : roi < 0 ? "negative" : "zero";
    const roiSign  = roi > 0 ? "↑" : roi < 0 ? "↓" : "—";

    return `
      <tr>
        <td><span class="text-secondary">#${campaign.id}</span></td>
        <td class="fw-bold">${campaign.name}</td>
        <td>${campaign.product}</td>
        <td class="text-end">
          <span class="roi-pill ${roiClass}">${roiSign} ${roi}%</span>
        </td>
        <td class="text-end">
          <button class="btn-action btn-add-log"
            data-id="${campaign.id}" title="Adicionar Log">📝</button>
          <button class="btn-action btn-view-stats"
            data-id="${campaign.id}" title="Ver Estatísticas">📊</button>
          <button class="btn-action btn-edit"
            data-id="${campaign.id}"
            data-name="${campaign.name}"
            data-product="${campaign.product}"
            title="Editar Campanha">✏️</button>
          <button class="btn-action btn-del btn-delete"
            data-id="${campaign.id}"
            data-name="${campaign.name}"
            title="Excluir Campanha">🗑️</button>
        </td>
      </tr>
    `;
  },

  renderData: (campaigns) => {
    UI.clearTable();

    if (campaigns.length === 0) {
      DOM.tableBody.innerHTML =
        '<tr><td colspan="5" class="text-center py-4" style="color:var(--text-3)">Nenhuma campanha encontrada.</td></tr>';
      return;
    }

    DOM.tableBody.innerHTML = campaigns.map((c) => UI.buildRowHtml(c)).join("");
    DOM.tableBody.querySelectorAll("[title]").forEach((t) => new bootstrap.Tooltip(t));
  },

  openDeleteModal: (id, name) => {
    _pendingDeleteId = id;
    DOM.delete.campaignName.innerText = name;
    DOM.modals.delete.show();
  },

  openLogModal: (campaignId) => {
    DOM.inputs.logCampaignId.value        = campaignId;
    DOM.inputs.logCampaignLabel.innerText = `#${campaignId}`;
    DOM.inputs.logDate.valueAsDate        = new Date();
    DOM.modals.log.show();
  },

  openEditModal: (id, name, product) => {
    DOM.inputs.editId.value      = id;
    DOM.inputs.editName.value    = name;
    DOM.inputs.editProduct.value = product;
    DOM.modals.edit.show();
  },

  clearLogForm: () => {
    DOM.inputs.logSpend.value   = "";
    DOM.inputs.logRevenue.value = "";
  },

  clearCampaignForm: () => {
    DOM.inputs.campaignName.value    = "";
    DOM.inputs.campaignProduct.value = "";
  },

  fillStatsModal: (logs) => {
    DOM.stats.logsTable.innerHTML = "";

    // Sem logs: zera métricas, garante que não há gráfico residual e abre modal
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      DOM.stats.logsTable.innerHTML =
        "<tr><td colspan='4' class='text-center py-3' style='color:var(--text-3)'>Nenhum registro encontrado.</td></tr>";
      DOM.stats.totalSpend.innerText   = Utils.formatCurrency(0);
      DOM.stats.totalRevenue.innerText = Utils.formatCurrency(0);
      DOM.stats.roi.innerText          = "0%";
      RoiChart.destroy();
      DOM.modals.stats.show();
      return;
    }

    // Calcula totais e atualiza cards de resumo
    const totalSpend   = logs.reduce((acc, l) => acc + l.spend, 0);
    const totalRevenue = logs.reduce((acc, l) => acc + l.revenue, 0);
    const roi          = Utils.calculateRoi(totalSpend, totalRevenue);

    DOM.stats.totalSpend.innerText   = Utils.formatCurrency(totalSpend);
    DOM.stats.totalRevenue.innerText = Utils.formatCurrency(totalRevenue);
    DOM.stats.roi.innerText          = `${roi}%`;

    // Renderiza tabela de histórico (mais recente primeiro)
    DOM.stats.logsTable.innerHTML = [...logs]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((log) => {
        const profit      = log.revenue - log.spend;
        const profitClass = profit >= 0 ? "text-success" : "text-danger";
        return `
          <tr>
            <td>${new Date(log.date).toLocaleDateString("pt-BR")}</td>
            <td class="text-end text-danger">- ${Utils.formatCurrency(log.spend)}</td>
            <td class="text-end text-success">+ ${Utils.formatCurrency(log.revenue)}</td>
            <td class="text-end ${profitClass} fw-bold">${Utils.formatCurrency(profit)}</td>
          </tr>
        `;
      })
      .join("");

    // O gráfico precisa que o canvas tenha dimensões reais.
    // shown.bs.modal dispara após a animação de abertura — canvas visível e dimensionado.
    const statsModalEl = document.getElementById("modalStats");

    statsModalEl.addEventListener(
      "shown.bs.modal",
      () => RoiChart.render(DOM.stats.canvas, logs),
      { once: true }
    );

    // Libera memória do canvas ao fechar o modal
    statsModalEl.addEventListener(
      "hidden.bs.modal",
      () => RoiChart.destroy(),
      { once: true }
    );

    DOM.modals.stats.show();
  },
};

// --- 4. App Logic ---
const App = {
  init: () => {
    App.setupEventListeners();
    App.loadCampaigns();
  },

  loadCampaigns: async () => {
    UI.showSkeleton();

    try {
      const campaigns = await api.getCampaigns();

      const campaignsWithStats = await Promise.all(
        campaigns.map(async (campaign) => {
          const stats = await api.getStats(campaign.id);
          return {
            ...campaign,
            stats: stats || { roi: 0, totalSpend: 0, totalRevenue: 0 },
          };
        })
      );

      const sorted = [...campaignsWithStats].sort((a, b) => b.id - a.id);
      UI.renderData(sorted);
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error);
      Toast.error("Não foi possível carregar as campanhas.");
      DOM.tableBody.innerHTML =
        '<tr><td colspan="5" class="text-center py-4" style="color:var(--red)">Erro ao carregar dados da API.</td></tr>';
    }
  },

  createCampaign: async () => {
    const name    = DOM.inputs.campaignName.value.trim();
    const product = DOM.inputs.campaignProduct.value.trim();

    if (!name || !product) {
      Toast.warning("Preencha todos os campos.");
      return;
    }

    const btn = DOM.buttons.saveCampaign;
    Utils.setLoading(btn, true);

    try {
      await api.createCampaign({ name, product });
      UI.clearCampaignForm();

      onModalClose(document.getElementById("modalNewCampaign"), async () => {
        Toast.success("Campanha criada com sucesso!");
        await App.loadCampaigns();
      });

      DOM.modals.newCampaign.hide();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      Utils.setLoading(btn, false);
    }
  },

  editCampaign: async () => {
    const id      = DOM.inputs.editId.value;
    const name    = DOM.inputs.editName.value.trim();
    const product = DOM.inputs.editProduct.value.trim();

    if (!name || !product) {
      Toast.warning("Preencha todos os campos.");
      return;
    }

    const btn = DOM.buttons.saveEdit;
    Utils.setLoading(btn, true);

    try {
      await api.updateCampaign(id, { name, product });

      onModalClose(document.getElementById("modalEditCampaign"), async () => {
        Toast.success("Campanha atualizada!");
        await App.loadCampaigns();
      });

      DOM.modals.edit.hide();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      Utils.setLoading(btn, false);
    }
  },

  confirmDelete: async () => {
    if (!_pendingDeleteId) return;

    const btn = DOM.buttons.confirmDelete;
    Utils.setLoading(btn, true);

    try {
      await api.deleteCampaign(_pendingDeleteId);

      onModalClose(document.getElementById("modalConfirmDelete"), async () => {
        Toast.success("Campanha excluída com sucesso.");
        await App.loadCampaigns();
      });

      DOM.modals.delete.hide();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      Utils.setLoading(btn, false);
      _pendingDeleteId = null;
    }
  },

  addLog: async () => {
    const id      = DOM.inputs.logCampaignId.value;
    const date    = DOM.inputs.logDate.value;
    const spend   = DOM.inputs.logSpend.value;
    const revenue = DOM.inputs.logRevenue.value;

    if (!date || !spend || !revenue) {
      Toast.warning("Preencha a data e os valores.");
      return;
    }

    const btn = DOM.buttons.saveLog;
    Utils.setLoading(btn, true);

    try {
      await api.addLog(parseInt(id), {
        date,
        spend: parseFloat(spend),
        revenue: parseFloat(revenue),
      });

      onModalClose(document.getElementById("modalAddLog"), async () => {
        Toast.success("Log salvo com sucesso!");
        await App.loadCampaigns();
      });

      DOM.modals.log.hide();
      UI.clearLogForm();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      Utils.setLoading(btn, false);
    }
  },

  viewStats: async (id) => {
    try {
      const logs = await api.getLogs(id);
      UI.fillStatsModal(logs);
    } catch (error) {
      console.error(error);
      Toast.error("Erro ao buscar histórico da campanha.");
    }
  },

  setupEventListeners: () => {
    DOM.openNewCampaignBtn.addEventListener("click", () => {
      DOM.modals.newCampaign.show();
    });

    DOM.tableBody.addEventListener("click", (e) => {
      const logBtn = e.target.closest(".btn-add-log");
      if (logBtn) return UI.openLogModal(logBtn.dataset.id);

      const statsBtn = e.target.closest(".btn-view-stats");
      if (statsBtn) return App.viewStats(statsBtn.dataset.id);

      const editBtn = e.target.closest(".btn-edit");
      if (editBtn) return UI.openEditModal(
        editBtn.dataset.id,
        editBtn.dataset.name,
        editBtn.dataset.product
      );

      const deleteBtn = e.target.closest(".btn-delete");
      if (deleteBtn) return UI.openDeleteModal(
        deleteBtn.dataset.id,
        deleteBtn.dataset.name
      );
    });

    DOM.buttons.saveCampaign.addEventListener("click", App.createCampaign);
    DOM.buttons.saveLog.addEventListener("click", App.addLog);
    DOM.buttons.saveEdit.addEventListener("click", App.editCampaign);
    DOM.buttons.confirmDelete.addEventListener("click", App.confirmDelete);
  },
};

document.addEventListener("DOMContentLoaded", App.init);