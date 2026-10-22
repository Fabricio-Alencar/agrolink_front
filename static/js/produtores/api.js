
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
        console.log("🔍 Buscando meus produtos...");
        console.log("📡 URL:", `${API_URL}/meus-produtos`);

        try {
            const res = await fetch(`${API_URL}/meus-produtos`, {
                method: "GET",
                credentials: "include"
            });

            console.log("📥 Status meusProdutos:", res.status);

            const data = await res.json();

            console.log("📦 Dados recebidos:", data);

            if (!res.ok) {
                console.error("❌ Erro meusProdutos:", data);
                return [];
            }

            return data;

        } catch (error) {
            console.error("❌ Erro de rede:", error);
            return [];
        }
    },


    // =========================
    // CRIAR PRODUTO (LOGADO)
    // =========================
    async criarProduto(formData) {

        console.log("🟢 INICIANDO CRIAÇÃO DE PRODUTO");
        console.log("📡 URL:", `${API_URL}/produtos`);
        console.log("📤 Método: POST");
        console.log("🔐 Credentials: include");

        // Verificar conteúdo do FormData
        console.log("📋 Dados enviados no FormData:");

        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`📁 ${key}:`, {
                    nome: value.name,
                    tipo: value.type,
                    tamanho: value.size
                });
            } else {
                console.log(`📝 ${key}:`, value);
            }
        }

        try {

            const res = await fetch(`${API_URL}/produtos`, {
                method: "POST",
                body: formData,
                credentials: "include"
            });

            console.log("📥 Status criação:", res.status);
            console.log("📥 OK:", res.ok);

            const data = await res.json();

            console.log("📦 Resposta completa:", JSON.stringify(data, null, 2));
            if (!res.ok) {
                console.error("❌ Erro ao criar produto:", data);
            } else {
                console.log("✅ Produto criado com sucesso!");
            }

            return data;

        } catch (error) {
            console.error("❌ Erro de rede ao criar:", error);
            return null;
        }
    },


    // =========================
    // EXCLUIR PRODUTOS DO USUÁRIO LOGADO
    // =========================
    async excluirProduto(id) {

        console.log("🔴 INICIANDO EXCLUSÃO DE PRODUTO");
        console.log("🆔 ID do produto:", id);
        console.log("📡 URL:", `${API_URL}/produtos/${id}`);
        console.log("📤 Método: DELETE");

        try {

            const res = await fetch(`${API_URL}/produtos/${id}`, {
                method: "DELETE",
                credentials: "include"
            });

            console.log("📥 Status exclusão:", res.status);
            console.log("📥 OK:", res.ok);

            const data = await res.json();

            console.log("📦 Resposta do backend:", data);

            if (!res.ok) {
                console.error("❌ Erro ao deletar:", data);
                return null;
            }

            console.log("✅ Produto excluído com sucesso!");

            return data;

        } catch (error) {
            console.error("❌ Erro de rede ao excluir:", error);
            return null;
        }
    },


    // =========================
    // ATUALIZAR PRODUTO (LOGADO)
    // =========================
    async atualizarProduto(id, formData) {

        console.log("🟡 INICIANDO ATUALIZAÇÃO DE PRODUTO");
        console.log("🆔 ID do produto:", id);
        console.log("📡 URL:", `${API_URL}/produtos/${id}`);
        console.log("📤 Método: POST");
        console.log("🔐 Credentials: include");

        // Verificar conteúdo do FormData
        console.log("📋 Dados enviados no FormData:");

        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`📁 ${key}:`, {
                    nome: value.name,
                    tipo: value.type,
                    tamanho: value.size
                });
            } else {
                console.log(`📝 ${key}:`, value);
            }
        }

        try {

            const res = await fetch(`${API_URL}/produtos/${id}`, {
                method: "POST",
                body: formData,
                credentials: "include"
            });

            console.log("📥 Status atualização:", res.status);
            console.log("📥 OK:", res.ok);

            const data = await res.json();

            console.log("📦 Resposta do backend:", data);

            if (!res.ok) {
                console.error("❌ Erro ao atualizar produto:", data);
                return data;
            }

            console.log("✅ Produto atualizado com sucesso!");

            return data;

        } catch (error) {
            console.error("❌ Erro de rede na atualização:", error);

            return {
                erro: "Falha na conexão com o servidor."
            };
        }
    },

};