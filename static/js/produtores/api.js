/**
 * ARQUIVO: api.js
 * OBJETIVO: Centralizar comunicação com backend Flask
 * OBS: Trabalha com sessão (login Flask via cookie)
 */

const API_URL = "https://back-agrolink-bmbkepbbdkabdhhd.eastus-01.azurewebsites.net/";

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
                credentials: "include" // 🔐 necessário para session Flask
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Erro meusProdutos:", data);
                return [];
            }

            return data;

        } catch (error) {
            console.error("Erro de rede:", error);
            return [];
        }
    },

    
    // =========================
    // CRIAR PRODUTO (LOGADO)
    // =========================
    async criarProduto(formData) { // Agora recebe o formData com a foto
    try {
        const res = await fetch(`${API_URL}/produtos`, {
            method: "POST",
            body: formData, // Envia o formData direto (SEM JSON.stringify)
            credentials: "include"
        });
        return await res.json();
    } catch (error) {
        console.error("Erro:", error);
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
                credentials: "include" // Essencial para manter a sessão (session.get)
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Erro ao deletar:", data);
                return null; // Mudei para null para facilitar a checagem
            }

            return data;

        } catch (error) {
            console.error("Erro de rede:", error);
            return null;
        }
    },

    // =========================
    // ATUALIZAR PRODUTO (LOGADO)
    // =========================
    async atualizarProduto(id, formData) {
        try {
            const res = await fetch(`${API_URL}/produtos/${id}`, {
                method: "POST", // Usamos POST para suportar Multipart/FormData com arquivos
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
            console.error("Erro de rede na atualização:", error);
            return { erro: "Falha na conexão com o servidor." };
        }
    },
};