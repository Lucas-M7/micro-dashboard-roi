import "bootstrap/dist/css/bootstrap.min.css";
import * as bootstrap from "bootstrap";

window.bootstrap = bootstrap;

import "./assets/style.css";
import { api } from "./services/api.js";

const tabelaCorpo = document.getElementById("tabela-corpo");
const btnSalvarCampanha = document.getElementById("btnSalvarCampanha");
const btnSalvarLog = document.getElementById("btnSalvarLog");
const inputNome = document.getElementById("campanhaNome");
const inputProduto = document.getElementById("campanhaProduto");

const modalLogCampanha = new bootstrap.Modal(
  document.getElementById("modalLogCampanha")
);

const modalNovaCampanha = new bootstrap.Modal(
  document.getElementById("modalNovaCampanha")
);

function somarLogs(logs) {
  if (!logs || logs.length === 0) return { spend: 0, revenue: 0 };

  const totalSpend = logs.reduce((acc, log) => acc + log.spend, 0);
  const totalRevenue = logs.reduce((acc, log) => acc + log.revenue, 0);

  return { spend, revenue };
}

function calcularROI(spend, revenue) {
  if (spend === 0) return 0;
  return (((revenue - spend) / spend) * 100).toFixed(0);
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function renderizarTabela(campanhas) {
  tabelaCorpo.innerHTML = "";

  campanhas.forEach((campanha) => {
    const roi = campanha.stats.roi;

    const corBadge =
      roi >= 0 ? "text-success bg-success" : "text-danger bg-danger";

    const htmlLinha = `
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
                    <button class="btn btn-sm btn-outline-info" title="Ver Estatísticas">
                        📊
                    </button>
                </td>
            </tr>
        `;
    tabelaCorpo.innerHTML += htmlLinha;
  });

  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]'
  );
  [...tooltipTriggerList].map((t) => new bootstrap.Tooltip(t));
}

function atualizarDashboard(campanhas) {

  const totalGasto = campanhas.reduce((acc, c) => acc + (c.stats.totalSpend || 0), 0);
  const totalFaturamento = campanhas.reduce((acc, c) => acc + (c.stats.totalRevenue || 0), 0);

  const roiGeral = calcularROI(totalGasto, totalFaturamento);

  document.getElementById("val-spend").innerText = formatarMoeda(totalGasto);
  document.getElementById("val-revenue").innerText = formatarMoeda(totalFaturamento);
  document.getElementById("val-roi").innerText = `${roiGeral}%`;
}

async function carregarDados() {
  try {
    // 1. Busca a lista crua de campanhas (sem logs, sem stats)
    let campanhas = await api.getCampaigns();

    const campanhasComStats = await Promise.all(
      campanhas.map(async (campanha) => {
        // Chama o endpoint de estatísticas para ESSA campanha
        const stats = await api.getStats(campanha.id);

        // Retorna a campanha original + uma nova propriedade 'stats'
        // Se a API retornar null (sem logs), usamos valores padrão { roi: 0, ... }
        return {
          ...campanha,
          stats: stats || { spend: 0, revenue: 0, roi: 0 },
        };
      })
    );

    // 3. Ordena e Fatia
    campanhasComStats.sort((a, b) => b.id - a.id);
    const recentes = campanhasComStats.slice(0, 5);

    // 4. Renderiza usando os dados novos
    renderizarTabela(recentes);
    atualizarDashboard(campanhasComStats);

    console.log("Dados carregados e enriquecidos via Backend C#!");
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    alert("Erro ao carregar dados.");
  }
}

btnSalvarCampanha.addEventListener("click", async () => {
  const nome = inputNome.value;
  const produto = inputProduto.value;

  if (!nome || !produto) {
    alert("Preencha todos os campos!");
    return;
  }

  try {
    await api.createCampaign({ name: nome, product: produto });

    inputNome.value = "";
    inputProduto.value = "";
    modalNovaCampanha.hide();

    await carregarDados();
  } catch (error) {
    alert("Erro ao criar campanha: " + error.message);
  }
});

// Inicializar todos os tooltips
const tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]'
);
const tooltipList = [...tooltipTriggerList].map(
  (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
);

// Inicializar todos os popovers
const popoverTriggerList = document.querySelectorAll(
  '[data-bs-toggle="popover"]'
);
const popoverList = [...popoverTriggerList].map(
  (popoverTriggerEl) => new bootstrap.Popover(popoverTriggerEl)
);

tabelaCorpo.addEventListener("click", (evento) => {
  const elementoClicado = evento.target;

  const botaoLog = elementoClicado.closest(".btn-add-log");

  if (botaoLog) {
    const idCampanha = botaoLog.dataset.id;

    document.getElementById("idCampanhaLog").value = idCampanha;
    document.getElementById("spanIdVisual").innerText = `#${idCampanha}`;

    modalLogCampanha.show();

    document.getElementById("logData").valueAsDate = new Date();
  }
});

btnSalvarLog.addEventListener("click", async () => {
  const idCampanhaInput = document.getElementById("idCampanhaLog").value;
  const dataSelecionada = document.getElementById("logData").value;
  const valorSpend = document.getElementById("logSpend").value;
  const valorRevenue = document.getElementById("logRevenue").value;

  if (!dataSelecionada || !valorSpend || !valorRevenue) {
    alert("Por favor, preencha a data e os valores!");
    return;
  }

  try {
    const idCampanha = parseInt(idCampanhaInput);

    const dadosLog = {
      date: dataSelecionada,
      spend: parseFloat(valorSpend),
      revenue: parseFloat(valorRevenue),
    };

    await api.addLog(idCampanha, dadosLog);

    alert("Log da campanha salva com sucesso!");

    modalLogCampanha.hide();

    document.getElementById("logSpend").value = "";
    document.getElementById("logRevenue").value = "";

    await carregarDados();
  } catch (error) {
    console.error(error);
    alert("Erro ao salvar log. Verifique o console.");
  }
});

carregarDados();
