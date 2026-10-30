const Auth = {

    // =========================
    // SALVAR USUÁRIO
    // =========================

    save(user) {
        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );
    },


    // =========================
    // OBTER USUÁRIO
    // =========================

    get() {
        try {
            const user = localStorage.getItem("user");

            if (!user) {
                return null;
            }

            return JSON.parse(user);

        } catch (error) {
            console.error(
                "Erro ao recuperar usuário:",
                error
            );

            return null;
        }
    },


    // =========================
    // VERIFICAR LOGIN
    // =========================

    isLogged() {
        return this.get() !== null;
    },


    // =========================
    // ID DO USUÁRIO
    // =========================

    getId() {
        return this.get()?.id || null;
    },


    // =========================
    // TIPO DO USUÁRIO
    // =========================

    getType() {
        return this.get()?.tipo || null;
    },


    // =========================
    // NOME DO USUÁRIO
    // =========================

    getName() {
        return this.get()?.nome || null;
    },


    // =========================
    // LOGOUT
    // =========================

    logout() {
        // Encerra as conexões do chat, caso a função exista.
        if (
            typeof window.desconectarWebSockets === "function"
        ) {
            window.desconectarWebSockets();
        }

        // Remove os dados da sessão.
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");

        // Remove o cookie de autenticação.
        document.cookie =
            "access_token=; Max-Age=0; path=/";

        // Redireciona para a página de login.
        window.location.href = "/login";
    }

};


// =========================
// DISPONIBILIZAR GLOBALMENTE
// =========================

window.Auth = Auth;

export { Auth };