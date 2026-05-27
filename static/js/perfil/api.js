const API_URL = "http://127.0.0.1:5000";

export const API = {
    async obterPerfil() {
        try {
            const res = await fetch(`${API_URL}/perfil`, { 
                method: 'GET',
                credentials: 'include' // Garante o envio dos cookies de sessão
            });
            if (!res.ok) throw new Error('Erro ao carregar os dados do perfil.');
            return await res.json();
        } catch (error) {
            console.error("Erro na API obterPerfil:", error.message);
            throw error;
        }
    },

    async atualizarPerfil(formData) {
        try {
            const res = await fetch(`${API_URL}/perfil`, {
                method: 'POST',
                credentials: 'include', // Mantém a sessão ativa no envio
                body: formData
            });
            if (!res.ok) {
                const erro = await res.json();
                throw new Error(erro.erro || 'Erro ao salvar os dados.');
            }
            return await res.json();
        } catch (error) {
            console.error("Erro na API atualizarPerfil:", error.message);
            throw error;
        }
    },

    async excluirConta() {
        try {
            const res = await fetch(`${API_URL}/perfil`, { 
                method: 'DELETE',
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Erro ao excluir a conta.');
            return await res.json();
        } catch (error) {
            console.error("Erro na API excluirConta:", error.message);
            throw error;
        }
    }
};