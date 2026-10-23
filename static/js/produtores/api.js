/**
 * ARQUIVO: api.js
 * OBJETIVO: Centralizar comunicação com backend Flask
 * OBS: Trabalha com sessão (login Flask via cookie)
 */

const API_URL = CONFIG.API_URL;

/**
 * OBJETO GLOBAL DA API
 * (IMPORTANTE: usado pelo renderizar.js)
 */
const API = {

    // =========================
    // BUSCAR PRODUTOS DO USUÁRIO LOGADO
    // =========================
    async meusProdutos() {
        try {
            const res = await fetch(`${API_URL}/meus-produtos`, {
                method: "GET",
                credentials: "include"
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Erro ao buscar produtos:", data);
                return [];
            }

            return data;

        } catch (error) {
            console.error("Erro de rede ao buscar produtos:", error);
            return [];
        }
    },


    // =========================
    // CRIAR PRODUTO (LOGADO)
    // =========================
    async criarProduto(formData) {
        try {
            const res = await fetch(`${API_URL}/produtos`, {
                method: "POST",
                body: formData,
                credentials: "include"
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Erro ao criar produto:", data);
            }

            return data;

        } catch (error) {
            console.error("Erro de rede ao criar produto:", error);
            return null;
        }
    },


    // =========================
    // EXCLUIR PRODUTOS DO USUÁRIO LOGADO
    // =========================
    async excluirProduto(id) {
        try {
            const res = await fetch(`${API_URL}/produtos/${id}`, {
                method: "DELETE",
                credentials: "include"
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Erro ao excluir produto:", data);
                return null;
            }

            return data;

        } catch (error) {
            console.error("Erro de rede ao excluir produto:", error);
            return null;
        }
    },


    // =========================
    // ATUALIZAR PRODUTO (LOGADO)
    // =========================
    async atualizarProduto(id, formData) {
        try {
            const res = await fetch(`${API_URL}/produtos/${id}`, {
                method: "POST",
                body: formData,
                credentials: "include"
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Erro ao atualizar produto:", data);
                return data;
            }

            return data;

        } catch (error) {
            console.error("Erro de rede ao atualizar produto:", error);

            return {
                erro: "Falha na conexão com o servidor."
            };
        }
    }

};