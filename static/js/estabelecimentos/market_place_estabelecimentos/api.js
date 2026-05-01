/**
 * ARQUIVO: api.js
 * OBJETIVO: Centralizar comunicação com backend Flask
 */

const API_URL = "https://back-agrolink-bmbkepbbdkabdhhd.eastus-01.azurewebsites.net/";

export const API = {
    // ==========================================
    // PRODUTOS
    // ==========================================
    
    /**
     * Busca a lista completa de produtos do marketplace
     * @returns {Promise<Array>} Lista de produtos ou array vazio
     */
    async listarProdutos() {
        try {
            const res = await fetch(`${API_URL}/produtos`, {
                method: "GET",
                // 🔐 Importante: Envia cookies de sessão para o Flask
                credentials: "include", 
                headers: {
                    "Content-Type": "application/json"
                }
            });

            // Verifica se a resposta é JSON antes de parsear
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Resposta do servidor não é JSON");
            }

            const data = await res.json();

            if (!res.ok) {
                // Caso o Flask retorne 401, 403 ou 500
                console.warn(`Aviso (${res.status}):`, data.erro || "Erro desconhecido");
                return [];
            }

            return data;

        } catch (error) {
            console.error("Erro de conexão com a API:", error.message);
            return [];
        }
    },

    // 🤝 ENVIAR NOVA NEGOCIAÇÃO (PEDIDO)
    async enviarNegociacao(dadosPedido) {
        try {
            const res = await fetch(`${API_URL}/negociar`, {
                method: "POST",
                credentials: "include", // 🔐 Importante para manter a sessão do usuário
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dadosPedido)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.erro || "Erro ao processar negociação");
            }

            return data; // Retorna mensagem de sucesso e ID da negociação

        } catch (error) {
            console.error("Erro na API de negociação:", error.message);
            throw error; // Repassa o erro para o Modal tratar com alert
        }
    },
    
};
