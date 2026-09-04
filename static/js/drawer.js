console.log("🔥 DRAWER.JS FOI CARREGADO!");

const btnAbrir = document.getElementById('botaoAbrirMenu');
const btnFechar = document.getElementById('botaoFecharMenu');
const menu = document.getElementById('painelLateral');
const mascara = document.getElementById('mascaraMenu');

console.log("btnAbrir:", btnAbrir);
console.log("btnFechar:", btnFechar);
console.log("menu:", menu);
console.log("mascara:", mascara);

const API_URL1 = CONFIG.API_URL;

function alternarMenu() {
    if (menu) {
        menu.classList.toggle('ativo');
    }
    if (mascara) {
        mascara.classList.toggle('ativo');
    }
}

function capitalizar(texto) {
    if (!texto) {
        return "";
    }
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function configurarFotoPerfil(img, foto) {
    if (!img) {
        return;
    }
    const fallback = "../static/assets/user.png";
    if (!foto) {
        console.log("🖼️ Nenhuma foto encontrada. Usando fallback.");
        img.src = fallback;
        return;
    }
    const caminhoFoto = String(foto).trim();
    console.log("🖼️ Configurando foto:", caminhoFoto);

    if (caminhoFoto.startsWith("http://") || caminhoFoto.startsWith("https://")) {
        console.log("☁️ Foto recebida como URL do Azure/SAS.");
        img.src = caminhoFoto;
    } else {
        const caminhoNormalizado = caminhoFoto.replace(/^\/+/, "");
        if (caminhoNormalizado.startsWith("static/")) {
            img.src = `${API_URL1}/${caminhoNormalizado}`;
        } else {
            img.src = `${API_URL1}/static/${caminhoNormalizado}`;
        }
    }

    img.onerror = () => {
        console.warn("⚠️ Não foi possível carregar a foto de perfil:", img.src);
        img.onerror = null;
        img.src = fallback;
    };
}

async function carregarUsuario() {
    try {
        console.log("🔄 Buscando sessão em:", `${API_URL1}/session`);
        const response = await fetch(`${API_URL1}/session`, {
            method: "GET",
            credentials: "include"
        });
        console.log("📡 Status /session:", response.status);
        const data = await response.json();

        console.log("🔎 RESPOSTA DO /session:");
        console.log(data);
        console.log("🖼️ FOTO DE PERFIL RECEBIDA:");
        console.log(data.foto_perfil);

        if (!data.logado) {
            console.log("⚠️ Usuário não logado.");
            return;
        }

        const nomeEl = document.getElementById("usuarioNome");
        const tipoEl = document.getElementById("usuarioTipo");
        const fotoEl = document.querySelector(".usuario-foto");

        if (nomeEl) {
            nomeEl.textContent = capitalizar(data.nome);
        }
        if (tipoEl) {
            tipoEl.textContent = capitalizar(data.tipo);
        }
        if (fotoEl) {
            console.log("🖼️ Foto de perfil recebida pelo drawer:", data.foto_perfil);
            configurarFotoPerfil(fotoEl, data.foto_perfil);
        } else {
            console.warn("⚠️ Elemento .usuario-foto não encontrado no HTML.");
        }

        const navNavegacao = document.querySelector(".painel-navegacao");
        console.log("Tag <nav> encontrada?", navNavegacao);
        console.log("Tipo vindo do banco:", data.tipo);

        if (navNavegacao && data.tipo) {
            const tipoUsuario = data.tipo.trim().toLowerCase();
            const urlAtual = window.location.pathname.toLowerCase();

            const isPerfil = urlAtual.includes("perfil");
            const isMarketplace = urlAtual.includes("marketplace") || urlAtual.includes("produtos");
            const isNegociacoes = urlAtual.includes("negociacoes");

            if (tipoUsuario === "estabelecimento") {
                navNavegacao.innerHTML = `
                    <a href="/marketplace" class="item-navegacao ${isMarketplace ? 'ativo' : ''}">
                        <span class="icone-box"><i data-lucide="store"></i></span>
                        Marketplace
                    </a>
                    <a href="/negociacoes_estabelecimento" class="item-navegacao ${isNegociacoes ? 'ativo' : ''}">
                        <span class="icone-box"><i data-lucide="shopping-cart"></i></span>
                        Pedidos
                    </a>
                    <a href="/perfil" class="item-navegacao ${isPerfil ? 'ativo' : ''}">
                        <span class="icone-box"><i data-lucide="user"></i></span>
                        Perfil
                    </a>
                `;
            } else if (tipoUsuario === "produtor") {
                navNavegacao.innerHTML = `
                    <a href="/meus_produtos" class="item-navegacao ${isMarketplace ? 'ativo' : ''}">
                        <span class="icone-box"><i data-lucide="package"></i></span>
                        Meus Produtos
                    </a>
                    <a href="/negociacoes_produtor" class="item-navegacao ${isNegociacoes ? 'ativo' : ''}">
                        <span class="icone-box"><i data-lucide="shopping-basket"></i></span>
                        Pedidos
                    </a>
                    <a href="/perfil" class="item-navegacao ${isPerfil ? 'ativo' : ''}">
                        <span class="icone-box"><i data-lucide="user"></i></span>
                        Perfil
                    </a>
                `;
            } else {
                console.error("❌ Tipo de usuário não reconhecido:", tipoUsuario);
            }

            if (window.lucide) {
                try {
                    window.lucide.createIcons();
                } catch (erro) {
                    console.error("❌ Erro ao criar ícones:", erro);
                }
            }
        }
        console.log("✅ Usuário carregado no drawer.");
    } catch (error) {
        console.error("❌ Erro ao carregar sessão:", error);
    }
}

if (btnAbrir) {
    btnAbrir.addEventListener('click', alternarMenu);
}
if (btnFechar) {
    btnFechar.addEventListener('click', alternarMenu);
}
if (mascara) {
    mascara.addEventListener('click', alternarMenu);
}

document.addEventListener("DOMContentLoaded", carregarUsuario);