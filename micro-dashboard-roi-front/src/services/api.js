// configuração centralizada
const API_CONFIG = {
  BASE_URL: "http://localhost:5078/api",
  HEADERS: {
    "Content-Type": "application/json",
  },
};

/*
 * Extrai a mensagem de erro do ErrorResponseDto do backend.
 * Se vier erros de validação, concatena tudo.
 * Fallback para texto genérico se o body não for JSON.
 */
async function extractErrorMessage(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const body = await response.json();

      // Erros de validação
      if (body.errors && typeof body.errors === "object") {
        const messages = Object.values(body.errors).flat();
        return messages.join(" • ");
      }

      // Erro com título descritivo
      if (body.title) return body.title;

      // Fallback para qualquer campo de mensagem
      if (body.detail) return body.detail;
      if (body.message) return body.message;
    } catch {
      // JSON malformado — cai no fallback abaixo
    }
  }

  // Resposta em texto puro
  const text = await response.text().catch(() => "");
  return text || `Erro ${response.status}`;
}

/**
 * Função genérica e privada para padronizar as chamadas HTTP.
 * Centraliza o tratamento de resposta e erros.
 */
async function request(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: API_CONFIG.HEADERS,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      const errorMessage = await extractErrorMessage(response);
      throw new Error(errorMessage);
    }

    // Verifica se tem conteúdo para converter em JSON
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await response.json();
    }

    return null;
  } catch (error) {
    console.error(`Falha na requisição para ${endpoint}:`, error);
    throw error;
  }
}

// Objeto exportado com métodos semânticos e limpos
export const api = {
  async getCampaigns() {
    return await request("/campaigns");
  },

  async createCampaign(campaignData) {
    return await request("/campaigns", "POST", campaignData);
  },

  async updateCampaign(campaignId, campaignData) {
    return await request(`/campaigns/${campaignId}`, "PUT", campaignData);
  },

  async getStats(campaignId) {
    return await request(`/campaigns/${campaignId}/stats`);
  },

  async addLog(campaignId, logData) {
    return await request(`/campaigns/${campaignId}/logs`, "POST", logData);
  },

  async getLogs(campaignId) {
    return await request(`/campaigns/${campaignId}/logs`);
  },

  async deleteCampaign(campaignId) {
    return await request(`/campaigns/${campaignId}`, "DELETE");
  },
};