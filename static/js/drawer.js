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
        const fotoEl = document.querySelector(".usuario-foto");

        if (nomeEl) nomeEl.textContent = capitalizar(data.nome);
        if (tipoEl) tipoEl.textContent = capitalizar(data.tipo);

        if (fotoEl && data.foto_perfil) {
            fotoEl.src = `../static/${data.foto_perfil}`;
        }

        // ==========================================
        // LÓGICA DINÂMICA DO MENU LATERAL
        // ==========================================
        const navNavegacao = document.querySelector(".painel-navegacao");
        
        // Logs de debug para você ver no F12 se algo falhar
        console.log("Tag <nav> encontrada?", navNavegacao);
        console.log("Tipo vindo do banco:", data.tipo);

        if (navNavegacao && data.tipo) {
            // .trim() remove espaços invisíveis antes ou depois da palavra
            const tipoUsuario = data.tipo.trim().toLowerCase(); 
            const urlAtual = window.location.pathname.toLowerCase();
            const isPerfil = urlAtual.includes("perfil");
            const isMarketplace = urlAtual.includes("marketplace") || urlAtual.includes("produtos");
            const isNegociacoes = urlAtual.includes("negociacoes");

            if (tipoUsuario === "estabelecimento") {
                navNavegacao.innerHTML = `
                    <a href="marketplace_estabelecimento.html" class="item-navegacao ${isMarketplace ? 'ativo' : ''}">
                        <span class="icone-box">📦</span> Marketplace
                    </a>
                    <a href="negociacoes_estabelecimento.html" class="item-navegacao ${isNegociacoes ? 'ativo' : ''}">
                        <span class="icone-box">🛍️</span> Negociações
                    </a>
                    <a href="perfil.html" class="item-navegacao ${isPerfil ? 'ativo' : ''}">
                        <span class="icone-box">👤</span> Perfil
                    </a>
                `;
            } else if (tipoUsuario === "produtor") {
                navNavegacao.innerHTML = `
                    <a href="produtos_produtor.html" class="item-navegacao ${isMarketplace ? 'ativo' : ''}">
                        <span class="icone-box">📦</span> Meus Produtos
                    </a>
                    <a href="negociacoes_produtor.html" class="item-navegacao ${isNegociacoes ? 'ativo' : ''}">
                        <span class="icone-box">🛍️</span> Negociações
                    </a>
                    <a href="perfil.html" class="item-navegacao ${isPerfil ? 'ativo' : ''}">
                        <span class="icone-box">👤</span> Perfil
                    </a>
                `;
            } else {
                console.error("Tipo de usuário não reconhecido pelo sistema:", tipoUsuario);
            }
        }

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
