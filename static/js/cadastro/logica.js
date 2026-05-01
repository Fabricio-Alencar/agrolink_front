const API_URL = "https://back-agrolink-bmbkepbbdkabdhhd.eastus-01.azurewebsites.net/";

// Inicializar os ícones do Lucide
lucide.createIcons();

// Estado iniciall
let userType = "produtor";

// Elementos
const btnProdutor = document.getElementById('type-produtor');
const btnEstabelecimento = document.getElementById('type-estabelecimento');
const passwordInput = document.getElementById('password');
const passwordConfirmInput = document.getElementById('password_confirm'); // Novo elemento
const btnTogglePassword = document.getElementById('btn-toggle-password');
const registerForm = document.getElementById('register-form');

// 1. Alternância de Tipo de Conta
function setAccountType(type) {
    userType = type;

    if (type === 'produtor') {
        btnProdutor.classList.add('active');
        btnEstabelecimento.classList.remove('active');
    } else {
        btnEstabelecimento.classList.add('active');
        btnProdutor.classList.remove('active');
    }

    console.log("Tipo de conta selecionado:", userType);
}

btnProdutor.addEventListener('click', () => setAccountType('produtor'));
btnEstabelecimento.addEventListener('click', () => setAccountType('estabelecimento'));

/**
 * 2. Mostrar/Ocultar Senha (Melhorado para suportar múltiplos botões)
 * Selecionamos todos os botões com a classe toggle-password para que ambos funcionem
 */
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
        // Encontra o input que está no mesmo wrapper que o botão clicado
        const input = btn.parentElement.querySelector('input');
        const isPassword = input.type === 'password';

        input.type = isPassword ? 'text' : 'password';

        btn.innerHTML = isPassword 
            ? '<i data-lucide="eye-off"></i>' 
            : '<i data-lucide="eye"></i>';

        lucide.createIcons();
    });
});

// 3. Submissão do Formulário
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // --- NOVA LÓGICA DE VALIDAÇÃO DE SENHA ---
    const senha = passwordInput.value;
    const confirmaSenha = passwordConfirmInput.value;

    if (senha !== confirmaSenha) {
        Swal.fire({
            toast: true,                // Ativa o modo Toast (estética 2 do seu CSS)
            position: 'top',            // Posiciona no topo
            icon: 'error',
            title: 'Senhas diferentes',
            text: 'A confirmação deve ser igual à senha.',
            showConfirmButton: false,   // Toasts geralmente não têm botão
            timer: 3000,                // Fecha sozinho em 3 segundos
            timerProgressBar: true      // Barra de progresso visual
        });
        return; // Interrompe o envio
    }
    // ------------------------------------------

    const formData = {
        tipo: userType,
        nome: document.getElementById('fullname').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('phone').value,
        estado: document.getElementById('estado').value,
        cidade: document.getElementById('cidade').value,
        senha: senha
    };

    console.log("--- Novo Cadastro ---");
    console.table(formData);

    try {
        const res = await fetch(`${API_URL}/cadastro`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.erro || "Erro ao criar conta");
        }


        console.log("Usuário criado:", data);
        console.log("REDIRECIONANDO PARA LOGIN...");

        window.location.href = "/login";
        return;

    } catch (error) {
        console.error(error);
        
        // Alerta de erro usando a classe .swal2-toast do seu CSS
        Swal.fire({
            toast: true,
            position: 'top',
            icon: 'error',
            title: error.message === "Erro ao criar conta" ? "Credenciais Inválidas" : error.message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }
});
