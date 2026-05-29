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
        // MENU DINÂMICO
        // ==========================================
        const navNavegacao = document.querySelector(".painel-navegacao");

        console.log("Tag <nav> encontrada?", navNavegacao);
        console.log("Tipo vindo do banco:", data.tipo);

        if (navNavegacao && data.tipo) {

            const tipoUsuario = data.tipo.trim().toLowerCase();

            const urlAtual = window.location.pathname.toLowerCase();

            // ROTAS ATIVAS
            const isPerfil = urlAtual.includes("perfil");

            const isMarketplace =
                urlAtual.includes("marketplace") ||
                urlAtual.includes("produtos");

            const isNegociacoes =
                urlAtual.includes("negociacoes");

            // ==========================================
            // ESTABELECIMENTO
            // ==========================================
            if (tipoUsuario === "estabelecimento") {

                navNavegacao.innerHTML = `
                    <a href="/marketplace" class="item-navegacao ${isMarketplace ? 'ativo' : ''}">
                        <span class="icone-box">
                            <i data-lucide="store"></i>
                        </span>

                        Marketplace
                    </a>

                    <a href="/negociacoes_estabelecimento" class="item-navegacao ${isNegociacoes ? 'ativo' : ''}">
                        <span class="icone-box">
                            <i data-lucide="shopping-cart"></i>
                        </span>

                        Pedidos
                    </a>

                    <a href="/perfil" class="item-navegacao ${isPerfil ? 'ativo' : ''}">
                        <span class="icone-box">
                            <i data-lucide="user"></i>
                        </span>

                        Perfil
                    </a>
                `;
            }

            // ==========================================
            // PRODUTOR
            // ==========================================
            else if (tipoUsuario === "produtor") {

                navNavegacao.innerHTML = `
                    <a href="/meus_produtos" class="item-navegacao ${isMarketplace ? 'ativo' : ''}">
                        <span class="icone-box">
                            <i data-lucide="package"></i>
                        </span>

                        Meus Produtos
                    </a>

                    <a href="/negociacoes_produtor" class="item-navegacao ${isNegociacoes ? 'ativo' : ''}">
                        <span class="icone-box">
                            <i data-lucide="shopping-basket"></i>
                        </span>

                        Pedidos
                    </a>

                    <a href="/perfil" class="item-navegacao ${isPerfil ? 'ativo' : ''}">
                        <span class="icone-box">
                            <i data-lucide="user"></i>
                        </span>

                        Perfil
                    </a>
                `;
            }

            else {
                console.error(
                    "Tipo de usuário não reconhecido:",
                    tipoUsuario
                );
            }

            // =========================
            // RENDERIZA ÍCONES LUCIDE
            // =========================
            lucide.createIcons();
        }

    } catch (error) {

        console.error(
            "Erro ao carregar sessão:",
            error
        );
    }
}

// =========================
// EVENTOS
// =========================
btnAbrir.addEventListener(
    'click',
    alternarMenu
);

btnFechar.addEventListener(
    'click',
    alternarMenu
);

mascara.addEventListener(
    'click',
    alternarMenu
);

// =========================
// INICIALIZA
// =========================
document.addEventListener(
    "DOMContentLoaded",
    carregarUsuario
);