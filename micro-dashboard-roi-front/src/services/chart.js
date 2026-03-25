/**
 * RoiChart — módulo de responsabilidade única para o gráfico de evolução do ROI.
 *
 * Responsabilidades:
 *   - Transformar logs brutos em datasets prontos para o Chart.js
 *   - Criar, atualizar e destruir a instância do gráfico
 *   - Encapsular toda a configuração visual
 *
 * Não conhece o DOM além do <canvas> recebido.
 * Não conhece modais, Bootstrap ou lógica de negócio.
 *
 * Uso:
 *   import { RoiChart } from './chart.js';
 *   RoiChart.render(canvasEl, logs); // modal deve estar visível
 *   RoiChart.destroy();              // chamar ao fechar o modal
 */

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Registra apenas os componentes usados — evita importar o bundle inteiro
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
);

// ─── Tokens de design — espelham as CSS vars do style.css ────────────────────
const COLORS = {
  ice:           "#8ecfdf",
  iceGlow:       "rgba(142, 207, 223, 0.15)",
  iceTransp:     "rgba(142, 207, 223, 0)",
  green:         "#4ade80",
  red:           "#f87171",
  grid:          "rgba(45, 51, 71, 0.8)",
  textMuted:     "#555c72",
  tooltipBg:     "#181c26",
  tooltipBorder: "#2d3347",
};

// Singleton — garante apenas uma instância ativa por vez
let _instance = null;

// ─── Transformação de dados ──────────────────────────────────────────────────

/**
 * Converte logs brutos em arrays prontos para o gráfico.
 * Ordena por data ASC e calcula o ROI acumulado entrada a entrada.
 *
 * @param {Array} logs - DailyLogDTO[]
 * @returns {{ labels, accumulatedRoi, expenses, revenues }}
 */
function buildDatasets(logs) {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  let accSpend   = 0;
  let accRevenue = 0;

  const labels         = [];
  const accumulatedRoi = [];
  const expenses       = [];
  const revenues       = [];

  for (const log of sorted) {
    accSpend   += log.spend;
    accRevenue += log.revenue;

    const roi = accSpend > 0
      ? Number((((accRevenue - accSpend) / accSpend) * 100).toFixed(1))
      : 0;

    labels.push(
      new Date(log.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      })
    );
    accumulatedRoi.push(roi);
    expenses.push(Number(log.spend.toFixed(2)));
    revenues.push(Number(log.revenue.toFixed(2)));
  }

  return { labels, accumulatedRoi, expenses, revenues };
}

// ─── Configuração do Chart.js ────────────────────────────────────────────────

function buildConfig(labels, datasets, gradientPlugin) {
  return {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            color: COLORS.textMuted,
            font: { family: "'DM Sans', sans-serif", size: 11 },
            boxWidth: 10,
            boxHeight: 10,
            borderRadius: 3,
            padding: 16,
            usePointStyle: true,
            pointStyle: "circle",
          },
        },
        tooltip: {
          backgroundColor: COLORS.tooltipBg,
          borderColor: COLORS.tooltipBorder,
          borderWidth: 1,
          titleColor: "#e8eaf0",
          bodyColor: "#8b90a0",
          padding: 12,
          cornerRadius: 8,
          titleFont: { family: "'DM Sans', sans-serif", size: 12, weight: "600" },
          bodyFont: { family: "'DM Mono', monospace", size: 11 },
          callbacks: {
            label: (item) => {
              const label = item.dataset.label ?? "";
              const value = item.parsed.y;

              if (label.includes("ROI")) return ` ROI: ${value}%`;

              return ` ${label}: ${new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(value)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: COLORS.grid, drawBorder: false },
          ticks: {
            color: COLORS.textMuted,
            font: { family: "'DM Sans', sans-serif", size: 10 },
            maxRotation: 0,
          },
        },
        // Eixo esquerdo — ROI em %
        yRoi: {
          type: "linear",
          position: "left",
          grid: { color: COLORS.grid, drawBorder: false },
          ticks: {
            color: COLORS.ice,
            font: { family: "'DM Mono', monospace", size: 10 },
            callback: (v) => `${v}%`,
          },
        },
        // Eixo direito — valores monetários (sem grid duplicado)
        yValue: {
          type: "linear",
          position: "right",
          grid: { drawOnChartArea: false },
          ticks: {
            color: COLORS.textMuted,
            font: { family: "'DM Mono', monospace", size: 10 },
            callback: (v) =>
              new Intl.NumberFormat("pt-BR", {
                notation: "compact",
                style: "currency",
                currency: "BRL",
              }).format(v),
          },
        },
      },
    },
    // Plugin passado aqui no nível do config da instância,
    // não via Chart.register — escopo isolado a este gráfico
    plugins: [gradientPlugin],
  };
}

// ─── API pública ─────────────────────────────────────────────────────────────

export const RoiChart = {
  /**
   * Renderiza o gráfico no canvas informado.
   * Destrói qualquer instância anterior antes de criar.
   * O modal deve estar visível quando esta função for chamada
   * para que o canvas tenha dimensões reais.
   *
   * @param {HTMLCanvasElement} canvas
   * @param {Array} logs - DailyLogDTO[]
   */
  render(canvas, logs) {
    this.destroy();

    const { labels, accumulatedRoi, expenses, revenues } = buildDatasets(logs);
    const ctx = canvas.getContext("2d");

    const datasets = [
      {
        label: "ROI Acumulado",
        data: accumulatedRoi,
        yAxisID: "yRoi",
        borderColor: COLORS.ice,
        backgroundColor: COLORS.iceTransp, // substituído pelo plugin abaixo
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: COLORS.ice,
        tension: 0.35,
        fill: true,
        order: 1,
      },
      {
        label: "Gasto",
        data: expenses,
        yAxisID: "yValue",
        borderColor: COLORS.red,
        backgroundColor: "transparent",
        borderWidth: 1.5,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: COLORS.red,
        tension: 0.35,
        borderDash: [4, 4],
        order: 2,
      },
      {
        label: "Receita",
        data: revenues,
        yAxisID: "yValue",
        borderColor: COLORS.green,
        backgroundColor: "transparent",
        borderWidth: 1.5,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: COLORS.green,
        tension: 0.35,
        borderDash: [4, 4],
        order: 3,
      },
    ];

    // Plugin de gradiente com flag interna — compatível com todas as versões
    // do Chart.js (evita tentar escrever em config.plugins que é readonly)
    let gradientApplied = false;
    const gradientPlugin = {
      id: "roiGradient",
      beforeDraw(chart) {
        if (gradientApplied || !chart.chartArea) return;

        const gradient = ctx.createLinearGradient(
          0, chart.chartArea.top,
          0, chart.chartArea.bottom
        );
        gradient.addColorStop(0, COLORS.iceGlow);
        gradient.addColorStop(1, COLORS.iceTransp);

        chart.data.datasets[0].backgroundColor = gradient;
        gradientApplied = true;
        chart.update("none"); // re-render sem animação para aplicar o gradiente
      },
    };

    _instance = new Chart(ctx, buildConfig(labels, datasets, gradientPlugin));
  },

  /**
   * Destrói a instância ativa e libera a memória do canvas.
   * Deve ser chamado no evento hidden.bs.modal do modal de stats.
   */
  destroy() {
    if (_instance) {
      _instance.destroy();
      _instance = null;
    }
  },
};