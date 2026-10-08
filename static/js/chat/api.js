const API_URL = CONFIG.API_URL;

export const API = {

    async buscarConversas() {

        try {

            const res = await fetch(
                `${API_URL}/chat/conversas`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            if (!res.ok) {

                throw new Error(
                    "Erro ao carregar as conversas."
                );

            }

            return await res.json();

        } catch (error) {

            console.error(
                "Erro na API buscarConversas:",
                error.message
            );

            throw error;
        }
    },


    async buscarMensagens(negociacaoId) {

        try {

            const res = await fetch(
                `${API_URL}/chat/mensagens/${negociacaoId}`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            if (!res.ok) {

                throw new Error(
                    "Erro ao carregar as mensagens."
                );

            }

            return await res.json();

        } catch (error) {

            console.error(
                "Erro na API buscarMensagens:",
                error.message
            );

            throw error;
        }
    },


    async verificarAcessoNegociacao(negociacaoId) {

        try {

            const res = await fetch(
                `${API_URL}/chat/acesso/${negociacaoId}`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            if (!res.ok) {

                throw new Error(
                    "Erro ao verificar acesso à negociação."
                );

            }

            return await res.json();

        } catch (error) {

            console.error(
                "Erro na API verificarAcessoNegociacao:",
                error.message
            );

            throw error;
        }
    },


    /* =====================================================
       BUSCAR INFORMAÇÕES DA NEGOCIAÇÃO
    ===================================================== */

    async buscarNegociacao(negociacaoId) {

        try {

            const res = await fetch(
                `${API_URL}/negociacoes/detalhes/${negociacaoId}`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            if (!res.ok) {

                throw new Error(
                    "Erro ao carregar informações da negociação."
                );

            }

            return await res.json();

        } catch (error) {

            console.error(
                "Erro na API buscarNegociacao:",
                error.message
            );

            throw error;
        }
    }

};
