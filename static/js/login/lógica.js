

const API_URL = "https://back-agrolink-bmbkepbbdkabdhhd.eastus-01.azurewebsites.net/";

/**
 * LÓGICA DE LOGIN - AGROCONNECT
 */

// 1. Variável de estado para armazenar o tipo de usuário selecionado (apenas UI)
let userType = "produtor";

// 2. Seleção de elementos do DOM para manipulação
const btnProdutor = document.getElementById('btn-produtor');
const btnEstabelecimento = document.getElementById('btn-estabelecimento');
const loginForm = document.getElementById('login-form');

/**
 * FUNCIONALIDADE: Alternância de Perfil (Toggle)
 * Remove a classe 'active' de um botão e adiciona ao outro.
 */
function switchUserType(type) {
    userType = type;

    if (type === 'produtor') {
        btnProdutor.classList.add('active');
        btnEstabelecimento.classList.remove('active');
    } else {
        btnEstabelecimento.classList.add('active');
        btnProdutor.classList.remove('active');
    }
}

// Eventos de clique para os botões de toggle (apenas visual)
btnProdutor.addEventListener('click', () => switchUserType('produtor'));
btnEstabelecimento.addEventListener('click', () => switchUserType('estabelecimento'));

/**
 * FUNCIONALIDADE: Submissão do Formulário
 * Agora conectado ao backend Flask (session-based auth)
 */
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede o recarregamento da página

    // Configuração do alerta de erro rápido (Toast)
    const Toast = Swal.mixin({
        toast: true,
        position: 'top', // definir posição do alerta...
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
    });

    // Captura dos valores dos campos
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  

    const data = {
        email: email,
        senha: password,
        tipo: userType
    };

    try {
        /**
         * =========================
         * CHAMADA API LOGIN FLASK
         * =========================
         */
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include", // 🔥 necessário para session Flask
            body: JSON.stringify(data)
        });

        const result = await res.json();

        // Se deu erro no backend
        if (!res.ok) {
            throw new Error(result.erro || "Erro no login");
        }

        console.log("Login realizado:", result);

        /**
         * =========================
         * SALVAR USUÁRIO NO FRONT (opcional)
         * =========================
         */
        if (window.Auth) {
            Auth.save(result);
        }
        
        

// CHECAGEM DE SEGURANÇA: O SweetAlert (Swal) existe?
const hasSwal = typeof Swal !== 'undefined';
        
        if (hasSwal) {
            // Criamos a instância e já usamos ela imediatamente
            const ToastMsg = Swal.mixin({
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true
            });

            // Usamos await para ele esperar o aviso aparecer antes de mudar de página
            await ToastMsg.fire({
                icon: 'success',
                title: 'Login realizado com sucesso!'
            });
        }

    

        /**
         * =========================
         * REDIRECIONAMENTO POR TIPO
         * =========================
         */
        if (result.tipo === "produtor") {
            window.location.href = "/meus_produtos";
        } 
        else if (result.tipo === "estabelecimento") {
            window.location.href = "/marketplace";
        } 
        else {
            window.location.href = "/login";
        }

    } catch (error) {
        console.error(error);
        
        // Alerta de erro 
        Toast.fire({
            icon: 'error',
            title: error.message
        });
    }
});
