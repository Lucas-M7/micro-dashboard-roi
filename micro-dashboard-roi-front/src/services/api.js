// configuração centralizada
const API_CONFIG = {
  BASE_URL: "http://localhost:5078/api",
  HEADERS: {
    "Content-Type": "application/json",
  },
};

/**
 * função genérica e privada para padronizar as chamadas HTTP.
 * centraliza o tratamento de resposta e erros.
 **/
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
            // tenta pegar a mensagem de erro do backend ou usa uma genérica
            const errorMessage = await response.text();
            throw new Error(`Erro na API (${response.status}): ${errorMessage || response.status}`);
        }

        // verifica se tem conteúdo para converter em JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        }

        return null;
    } catch (error) {
        console.error(`Falha na requisição para ${endpoint}:`, error);
        throw error;
    }
}

// objeto exportado com métodos semânticos e limpos
export const api = {
    // --- campanhas ---
    async getCampains() {
        return await request('/campaigns');
    },

    async createCampaign(campaignData) {
        return await request('/campaigns', 'POST', campaignData);
    },

    async getStats(campaignId) {
        return await request(`/campaigns/${campaignId}/stats`);
    },

    async addLog(campaignId, logData) {
        return await request(`/campaigns/${campaignId}/logs`, 'POST', logData);
    },

    async getLogs(campaignId) {
        return await request(`/campaigns/${campaignId}/stats`);
    }
}

// export const api = {
//   // --- 1. GET ---
//   // Equivalente ao HttpClient.GetAsync() do C#
//   async getCampaigns() {
//     try {
//       // 'fetch' é a ferramenta nativa para HTTP.
//       // o 'await' funciona igual ao C#.
//       const response = await fetch(`${API_BASE_URL}/campaigns`);

//       if (!response.ok) {
//         throw new Error("Erro ao buscar campanhas");
//       }

//       // 'repsonse.json()' converte o texto em Objeto JS.
//       // é como se fosse uma JsonSerializer no C#.
//       return await response.json();
//     } catch (error) {
//       console.error("Erro na API:", error);
//       return []; // retorna a lista vazia para não quebrar a tela.
//     }
//   },

//   // --- 2. POST ---
//   async createCampaign(campaignData) {
//     // campaignData é um objeto JS simples: {name: "...", product: "..."}

//     const response = await fetch(`${API_BASE_URL}/campaigns`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json", // avisa ao backend que um JSON está sendo enviado.
//       },
//       body: JSON.stringify(campaignData), // transforma o objeto em texto para viajar pela rede.
//     });

//     if (!response.ok) throw new Error("Erro ao criar campanha");
//     return await response.json();
//   },

//   // --- 3. GET STATS ---
//   async getStats(campaignId) {
//     const response = await fetch(
//       `${API_BASE_URL}/campaigns/${campaignId}/stats`
//     );
//     if (!response.ok) return null;
//     return await response.json();
//   },

//   // --- 4. POST LOG ---
//   async addLog(campaignId, logData) {
//     const response = await fetch(
//       `${API_BASE_URL}/campaigns/${campaignId}/logs`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(logData),
//       }
//     );
//     if (!response.ok) throw new Error("Erro ao lançar dados.");
//     return await response.json();
//   },
// };