/**
 * ARQUIVO: api.js
 * OBJETIVO: Centralizar comunicação com backend Flask
 */

const API_URL = "https://back-agrolink-bmbkepbbdkabdhhd.eastus-01.azurewebsites.net/";

export const API = {
    // ==========================================
    // NEGOCIAÇÕES
    // ==========================================
    
    /**
     * Busca a lista completa de negociações do marketplace
     * @returns {Promise<Array>} Lista de negociações ou array vazio
     */
    async listarNegociacoes(tipo_de_usuario) {
        try {
            const res = await fetch(`${API_URL}/negociacoes/${tipo_de_usuario}`, {
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

    /**
     * Atualiza o status geral da negociação
     */
    async atualizarStatus(id, novoStatus) {
        try {
            const res = await fetch(`${API_URL}/negociacoes/${id}/status`, {
                method: 'PUT',
                credentials: "include", 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: novoStatus })
            });

            if (!res.ok) throw new Error('Erro ao atualizar status');
            return await res.json();
        } catch (error) {
            console.error("Erro de conexão com a API:", error.message);
            throw error;
        }
    },

    /**
     * Registra confirmação (entrega ou recebimento)
     */
    async registrarConfirmacao(id, acao) {
        try {
            const res = await fetch(`${API_URL}/negociacoes/${id}/confirmar`, {
                method: 'PUT',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ acao: acao }) // 'confirmar_entrega' ou 'confirmar_recebimento'
            });

            if (!res.ok) throw new Error('Erro ao registrar confirmação');
            return await res.json();
        } catch (error) {
            console.error("Erro de conexão com a API:", error.message);
            throw error;
        }
    },

    /**
     * Pede a exclusão/ocultação da negociação
     */
    async deletarNegociacao(id) {
        try {
            const res = await fetch(`${API_URL}/negociacoes/${id}`, {
                method: 'DELETE',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) throw new Error('Erro ao deletar negociação');
            return await res.json();
        } catch (error) {
            console.error("Erro de conexão com a API:", error.message);
            throw error;
        }
    }
    
};

