const API_URL = CONFIG.API_URL;

/**
 * LÓGICA DE LOGIN - AGROLINK
 */

// =========================
// TIPO DE USUÁRIO
// =========================

let userType = "produtor";


// =========================
// ELEMENTOS DO DOM
// =========================

const btnProdutor = document.getElementById("btn-produtor");
const btnEstabelecimento = document.getElementById("btn-estabelecimento");
const loginForm = document.getElementById("login-form");


// =========================
// ALTERNÂNCIA DE PERFIL
// =========================

function switchUserType(type) {

    userType = type;

    if (type === "produtor") {

        btnProdutor.classList.add("active");
        btnEstabelecimento.classList.remove("active");

    } else {

        btnEstabelecimento.classList.add("active");
        btnProdutor.classList.remove("active");

    }
}


// =========================
// EVENTOS DOS BOTÕES
// =========================

btnProdutor.addEventListener("click", () => {
    switchUserType("produtor");
});

btnEstabelecimento.addEventListener("click", () => {
    switchUserType("estabelecimento");
});


// =========================
// LOGIN
// =========================

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();


    // =========================
    // TOAST
    // =========================

    const Toast = Swal.mixin({
        toast: true,
        position: "top",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
    });


    // =========================
    // DADOS DO FORMULÁRIO
    // =========================

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;


    const data = {
        email: email,
        senha: password,
        tipo: userType
    };


    try {

        // =========================
        // LOGIN NO BACKEND
        // =========================

        const res = await fetch(`${API_URL}/login`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            credentials: "include",

            body: JSON.stringify(data)
        });



        const result = await res.json();

        console.log("Resposta do login:", result);

        // =========================
        // VERIFICAR RESPOSTA
        // =========================

        if (!res.ok) {
            throw new Error(result.erro || "Erro no login");
        }


        // =========================
        // VERIFICAR USUÁRIO
        // =========================

        if (!result.user) {
            throw new Error("Dados do usuário não foram recebidos.");
        }


        // =========================
        // SALVAR USUÁRIO
        // =========================

        if (window.Auth) {
            Auth.save(result.user);
        }


        // =========================
        // MENSAGEM DE SUCESSO
        // =========================

        await Toast.fire({
            icon: "success",
            title: "Login realizado com sucesso!"
        });


        // =========================
        // REDIRECIONAMENTO
        // =========================

        if (result.user.tipo === "produtor") {

            window.location.href = "/meus_produtos";

        } else if (result.user.tipo === "estabelecimento") {

            window.location.href = "/marketplace";

        } else {

            console.error("Tipo de usuário inválido:", result.user.tipo);

            window.location.href = "/login";
        }


    } catch (error) {

        console.error("Erro no login:", error);

        Toast.fire({
            icon: "error",
            title: error.message
        });

    }

});