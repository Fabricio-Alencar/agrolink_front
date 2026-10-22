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

            console.error("Erro ao recuperar usuário:", error);

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

        localStorage.removeItem("user");

        window.location.href = "/login";

    }

};


// =========================
// DISPONIBILIZAR GLOBALMENTE
// =========================

window.Auth = Auth;