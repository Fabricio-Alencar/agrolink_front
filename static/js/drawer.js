const btnAbrir = document.getElementById('botaoAbrirMenu');
const btnFechar = document.getElementById('botaoFecharMenu');
const menu = document.getElementById('painelLateral');
const mascara = document.getElementById('mascaraMenu');
const API_URL1 = "https://back-agrolink-bmbkepbbdkabdhhd.eastus-01.azurewebsites.net/";

// =========================
// MENU
// =========================
function alternarMenu() {
    menu.classList.toggle('ativo');
    mascara.classList.toggle('ativo');
}

// =========================
// UTIL
// =========================
function capitalizar(texto) {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// =========================
// SESSÃO
// =========================
async function carregarUsuario() {
    try {
        const response = await fetch(`${API_URL1}/session`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!data.logado) {
            console.log("Usuário não logado");
            return;
        }

        const nomeEl = document.getElementById("usuarioNome");
        const tipoEl = document.getElementById("usuarioTipo");

        if (nomeEl) nomeEl.textContent = capitalizar(data.nome);
        if (tipoEl) tipoEl.textContent = capitalizar(data.tipo);

    } catch (error) {
        console.error("Erro ao carregar sessão:", error);
    }
}

// =========================
// EVENTOS
// =========================
btnAbrir.addEventListener('click', alternarMenu);
btnFechar.addEventListener('click', alternarMenu);
mascara.addEventListener('click', alternarMenu);

// carregar usuário ao abrir página
document.addEventListener("DOMContentLoaded", carregarUsuario);
