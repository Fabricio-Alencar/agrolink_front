const Auth = {

    save(user) {
        localStorage.setItem("user", JSON.stringify(user));
    },

    get() {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch {
            return null;
        }
    },

    isLogged() {
        return this.get() !== null;
    },

    getId() {
        return this.get()?.id || null;
    },

    getType() {
        return this.get()?.tipo || null;
    },

    getName() {
        return this.get()?.nome || null;
    },

    logout() {
        localStorage.removeItem("user");

        // opcional: também limpar sessão no backend futuramente
        window.location.href = "/login";
    }
};