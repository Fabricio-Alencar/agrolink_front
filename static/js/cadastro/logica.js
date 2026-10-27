import {
    formatarTelefone,
    telefoneValido
} from '../perfil/telefone.js';

const API_URL = CONFIG.API_URL;

// Inicializar os ícones do Lucide
lucide.createIcons();

// Estado inicial
let userType = "produtor";

// Elementos
const btnProdutor = document.getElementById('type-produtor');
const btnEstabelecimento = document.getElementById('type-estabelecimento');
const passwordInput = document.getElementById('password');
const passwordConfirmInput = document.getElementById('password_confirm');
const btnTogglePassword = document.getElementById('btn-toggle-password');
const registerForm = document.getElementById('register-form');

// =========================================================
// TELEFONE — MÁSCARA E VALIDAÇÃO
// =========================================================

const telefoneInput = document.getElementById('phone');

// Aplica a máscara enquanto o usuário digita.
telefoneInput.addEventListener('input', () => {
    telefoneInput.value = formatarTelefone(telefoneInput.value);
});

// Aplica a máscara ao colar um telefone.
telefoneInput.addEventListener('paste', () => {
    requestAnimationFrame(() => {
        telefoneInput.value = formatarTelefone(telefoneInput.value);
    });
});

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
 * 2. Mostrar/Ocultar Senha
 * Seleciona todos os botões com a classe toggle-password
 * para que ambos funcionem.
 */
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
        // Encontra o input no mesmo wrapper que o botão clicado.
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

    // =====================================================
    // VALIDAÇÃO DO TELEFONE
    // =====================================================

    const telefone = telefoneInput.value;

    if (!telefoneValido(telefone)) {
        Swal.fire({
            toast: true,
            position: 'top',
            icon: 'error',
            title: 'Telefone inválido',
            text: 'Informe o DDD e um número de telefone completo.',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });

        telefoneInput.focus();
        return;
    }

    // =====================================================
    // VALIDAÇÃO DA SENHA
    // =====================================================

    const senha = passwordInput.value;
    const confirmaSenha = passwordConfirmInput.value;

    if (senha !== confirmaSenha) {
        Swal.fire({
            toast: true,
            position: 'top',
            icon: 'error',
            title: 'Senhas diferentes',
            text: 'A confirmação deve ser igual à senha.',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });

        return;
    }

    // =====================================================
    // DADOS DO CADASTRO
    // =====================================================

    const formData = {
        tipo: userType,
        nome: document.getElementById('fullname').value,
        email: document.getElementById('email').value,
        telefone: telefone,
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

        await Swal.fire({
            toast: true,
            position: 'top',
            icon: 'success',
            title: 'Cadastro realizado com sucesso!',
            text: 'Você será redirecionado para a tela de login.',
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true
        });

        window.location.href = "/login";
        return;

    } catch (error) {
        console.error(error);

        // Alerta de erro usando a classe .swal2-toast do CSS.
        Swal.fire({
            toast: true,
            position: 'top',
            icon: 'error',
            title: error.message === "Erro ao criar conta"
                ? "Credenciais Inválidas"
                : error.message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }
});