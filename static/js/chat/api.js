/* =========================================================
   API DO CHAT - AGROLINK
========================================================= */

const API_URL = CONFIG.API_URL;

export const API = {

    /* =====================================================
       LISTAR CONVERSAS INICIADAS
    ===================================================== */

    async buscarConversas() {

        const resposta = await fetch(
            `${API_URL}/chat/conversas`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const dados = await resposta.json().catch(() => []);

        if (!resposta.ok) {
            throw new Error(
                dados.detail ||
                "Não foi possível carregar as conversas."
            );
        }

        return dados;
    },


    /* =====================================================
       INICIAR OU REUTILIZAR UMA CONVERSA
    ===================================================== */

    async iniciarConversa(negociacaoId) {

        const resposta = await fetch(
            `${API_URL}/chat/conversas/${encodeURIComponent(negociacaoId)}/iniciar`,
            {
                method: "POST",
                credentials: "include"
            }
        );

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(
                dados.detail ||
                "Não foi possível iniciar a conversa."
            );
        }

        return dados;
    },


    /* =====================================================
       BUSCAR MENSAGENS
    ===================================================== */

    async buscarMensagens(negociacaoId) {

        const resposta = await fetch(
            `${API_URL}/chat/mensagens/${encodeURIComponent(negociacaoId)}`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const dados = await resposta.json().catch(() => []);

        if (!resposta.ok) {
            throw new Error(
                dados.detail ||
                "Não foi possível carregar as mensagens."
            );
        }

        return dados;
    },


    /* =====================================================
       VERIFICAR ACESSO À NEGOCIAÇÃO
    ===================================================== */

    async verificarAcessoNegociacao(negociacaoId) {

        const resposta = await fetch(
            `${API_URL}/chat/acesso/${encodeURIComponent(negociacaoId)}`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(
                dados.detail ||
                "Você não tem acesso a esta conversa."
            );
        }

        return dados;
    },


    /* =====================================================
       BUSCAR DETALHES DA NEGOCIAÇÃO
    ===================================================== */

    async buscarNegociacao(negociacaoId) {

        const resposta = await fetch(
            `${API_URL}/negociacoes/detalhes/${encodeURIComponent(negociacaoId)}`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(
                dados.detail ||
                "Não foi possível carregar os detalhes da negociação."
            );
        }

        return dados;
    }

};