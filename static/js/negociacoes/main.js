const usuario = Auth.get();

if (!usuario) {

    window.location.href = "/login";

} else {

    const tipoUsuario = Auth.getType();

    try {

        if (tipoUsuario === "produtor") {

            await import("./main_produtor.js");

        } else if (tipoUsuario === "estabelecimento") {

            await import("./main_estabelecimento.js");

        } else {

            window.location.href = "/login";

        }

    } catch (error) {

        console.error("Erro ao carregar pedidos:", error);

    }

}