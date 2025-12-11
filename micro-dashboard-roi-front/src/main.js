import "bootstrap/dist/css/bootstrap.min.css";
import * as bootstrap from "bootstrap";

window.bootstrap = bootstrap;

import "./assets/style.css";
import { api } from "./services/api.js";

const tabelaCorpo = document.getElementById("tabela-corpo");
const btnSalvarCampanha = document.getElementById("btnSalvarCampanha");
const inputNome = document.getElementById("campanhaNome");
const inputProduto = document.getElementById("campanhaProduto");

const modalNovaCampanha = new bootstrap.Modal(
  document.getElementById("modalNovaCampanha")
);

function renderizarTabela(campanhas) {
  tabelaCorpo.innerHTML = "";

  campanhas.forEach((campanha) => {
    const htmlLinha = `
            <tr>
                <td><span class="text-muted">#${campanha.id}</span></td>
                <td class="fw-bold">${campanha.name}</td>
                <td>${campanha.product}</td>
                <td class="text-end">
                    <span class="badge bg-secondary bg-opacity-10 text-secondary px-3 py-2 rounded-pill">
                        --
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

  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  [...tooltipTriggerList].map(t => new bootstrap.Tooltip(t));
}

async function carregarDados() {
  try {
    let campanhas = await api.getCampaigns();
    campanhas.sort((a, b) => b.id - a.id);
    
    const campanhasRecents = campanhas.slice(0, 5);
    renderizarTabela(campanhasRecents);

    console.log("Tabela atualizada com as 5 mais recentes!");
  } catch (error) {
    console.error("Erro ao atualizar tabela:", error);
    alert("Erro ao carregar campanhas. Verifique o backend.");
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

carregarDados();
