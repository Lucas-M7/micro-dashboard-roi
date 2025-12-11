// URL base da API (BACKEND)
const API_BASE_URL = "http://localhost:5078/api";

export const api = {

    // --- 1. GET ---
    // Equivalente ao HttpClient.GetAsync() do C#
    async getCampaigns() {
        try {
            // 'fetch' é a ferramenta nativa para HTTP.
            // o 'await' funciona igual ao C#.
            const response = await fetch(`${API_BASE_URL}/campaigns`);

            if (!response.ok) {
                throw new Error('Erro ao buscar campanhas');
            }

            // 'repsonse.json()' converte o texto em Objeto JS.
            // é como se fosse uma JsonSerializer no C#.
            return await response.json();
        } catch (error) {
            console.error("Erro na API:", error);
            return []; // retorna a lista vazia para não quebrar a tela.
        }
    },

    // --- 2. POST ---
    async createCampaign(campaignData) {
        // campaignData é um objeto JS simples: {name: "...", product: "..."}
        
        const response = await fetch(`${API_BASE_URL}/campaigns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // avisa ao backend que um JSON está sendo enviado.
            },
            body: JSON.stringify(campaignData) // transforma o objeto em texto para viajar pela rede.
        });

        if (!response.ok) throw new Error('Erro ao criar campanha');
        return await response.json();
    },

    // --- 3. GET STATS ---
    async getStats(campaignId) {
        const repsonse = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/stats`);
        if (!repsonse.ok) return null;
        return await response.json();
    },

    // --- 4. POST LOG ---
    async addLog(campaignId, logData) {
        const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logData)
        });
        if (!response.ok) throw new Error('Erro ao lançar dados.');
        return await response.json();
    }
};