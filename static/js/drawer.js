
/* =====================================================
   ELEMENTOS DO DRAWER
===================================================== */

const btnAbrir = document.getElementById('botaoAbrirMenu');
const btnFechar = document.getElementById('botaoFecharMenu');
const menu = document.getElementById('painelLateral');
const mascara = document.getElementById('mascaraMenu');

const API_URL1 = CONFIG.API_URL;

let dadosGuiaDaPagina = null;


/* =====================================================
   ABRIR E FECHAR DRAWER
===================================================== */

function alternarMenu() {
    if (!menu) return;

    menu.classList.toggle('ativo');

    const aberto = menu.classList.contains('ativo');

    if (mascara) {
        mascara.classList.toggle('ativo', aberto);
    }

    atualizarGuiaDrawer(aberto);
}


/* =====================================================
   GUIA DE PASSOS
===================================================== */

function atualizarGuiaDrawer(aberto) {
    const elementoGuia = document.querySelector('guia-passos');

    if (!elementoGuia) return;

    if (aberto) {
        // Salva os atributos originais da página.
        dadosGuiaDaPagina = {
            titulo: elementoGuia.getAttribute('titulo'),
            subtitulo: elementoGuia.getAttribute('subtitulo'),
            passos: elementoGuia.getAttribute('passos')
        };

        elementoGuia.setAttribute('titulo', 'Guia do Menu Lateral');

        elementoGuia.setAttribute(
            'subtitulo',
            'Conheça o que você encontra em cada seção do sistema:'
        );

        elementoGuia.setAttribute(
            'passos',
            JSON.stringify([
                {
                    numero: 1,
                    titulo: 'Pedidos',
                    descricao: 'Aqui você pode encontrar e gerenciar todos os pedidos feitos.'
                },
                {
                    numero: 2,
                    titulo: 'Chat',
                    descricao: 'Aqui você pode encontrar suas conversas e negociar diretamente.'
                },
                {
                    numero: 3,
                    titulo: 'Perfil',
                    descricao: 'Aqui você gerencia suas informações pessoais e dados da conta.'
                },
                {
                    numero: 4,
                    titulo: 'Marketplace / Produtos',
                    descricao: 'Aqui você explora ou cadastra os itens disponíveis.'
                }
            ])
        );

        return;
    }

    // Restaura os atributos originais ao fechar.
    if (dadosGuiaDaPagina) {
        for (const atributo of ['titulo', 'subtitulo', 'passos']) {
            const valor = dadosGuiaDaPagina[atributo];

            if (valor === null) {
                elementoGuia.removeAttribute(atributo);
            } else {
                elementoGuia.setAttribute(atributo, valor);
            }
        }

        dadosGuiaDaPagina = null;
    }
}


/* =====================================================
   FORMATAÇÃO E FOTO DE PERFIL
===================================================== */

function capitalizar(texto) {
    if (!texto) return '';

    return texto.charAt(0).toUpperCase() + texto.slice(1);
}


function configurarFotoPerfil(img, foto) {
    if (!img) return;

    const fallback = '../static/assets/user.png';

    if (!foto) {
        img.src = fallback;
        return;
    }

    const caminhoFoto = String(foto).trim();

    if (
        caminhoFoto.startsWith('http://') ||
        caminhoFoto.startsWith('https://')
    ) {
        img.src = caminhoFoto;
    } else {
        const caminhoNormalizado = caminhoFoto.replace(/^\/+/, '');

        const caminhoCompleto = caminhoNormalizado.startsWith('static/')
            ? caminhoNormalizado
            : `static/${caminhoNormalizado}`;

        img.src = `${API_URL1}/${caminhoCompleto}`;
    }

    img.onerror = () => {
        console.warn('Não foi possível carregar a foto de perfil.');

        img.onerror = null;
        img.src = fallback;
    };
}


/* =====================================================
   NAVEGAÇÃO
===================================================== */

function obterNavegacao(tipoUsuario, paginaAtual) {
    const menus = {
        estabelecimento: [
            {
                texto: 'Marketplace',
                url: '/marketplace',
                icone: 'store',
                paginas: ['marketplace', 'produtos']
            },
            {
                texto: 'Pedidos',
                url: '/negociacoes_estabelecimento',
                icone: 'shopping-cart',
                paginas: ['negociacoes']
            },
            {
                texto: 'Chat',
                url: '/chat',
                icone: 'message-circle',
                paginas: ['chat']
            },
            {
                texto: 'Perfil',
                url: '/perfil',
                icone: 'user',
                paginas: ['perfil']
            }
        ],

        produtor: [
            {
                texto: 'Meus Produtos',
                url: '/meus_produtos',
                icone: 'package',
                paginas: ['marketplace', 'produtos']
            },
            {
                texto: 'Pedidos',
                url: '/negociacoes_produtor',
                icone: 'shopping-basket',
                paginas: ['negociacoes']
            },
            {
                texto: 'Chat',
                url: '/chat',
                icone: 'message-circle',
                paginas: ['chat']
            },
            {
                texto: 'Perfil',
                url: '/perfil',
                icone: 'user',
                paginas: ['perfil']
            }
        ]
    };

    return menus[tipoUsuario]?.map(item => ({
        ...item,
        ativo: item.paginas.some(pagina => paginaAtual.includes(pagina))
    })) ?? null;
}


function renderizarNavegacao(navNavegacao, tipoUsuario) {
    const paginaAtual = window.location.pathname.toLowerCase();
    const itens = obterNavegacao(tipoUsuario, paginaAtual);

    if (!itens) {
        console.error('Tipo de usuário não reconhecido:', tipoUsuario);
        return;
    }

    navNavegacao.innerHTML = itens.map(item => `
        <a
            href="${item.url}"
            class="item-navegacao ${item.ativo ? 'ativo' : ''}"
        >
            <span class="icone-box">
                <i data-lucide="${item.icone}"></i>
            </span>
            ${item.texto}
        </a>
    `).join('');

    if (window.lucide) {
        window.lucide.createIcons();
    }
}


/* =====================================================
   CARREGAR USUÁRIO
===================================================== */

async function carregarUsuario() {
    try {
        const response = await fetch(`${API_URL1}/session`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            console.error('Erro ao consultar sessão:', response.status);
            return;
        }

        const data = await response.json();

        if (!data.logado) return;

        const nomeEl = document.getElementById('usuarioNome');
        const tipoEl = document.getElementById('usuarioTipo');
        const fotoEl = document.querySelector('.usuario-foto');
        const navNavegacao = document.querySelector('.painel-navegacao');

        if (nomeEl) {
            nomeEl.textContent = capitalizar(data.nome);
        }

        if (tipoEl) {
            tipoEl.textContent = capitalizar(data.tipo);
        }

        if (fotoEl) {
            configurarFotoPerfil(fotoEl, data.foto_perfil);
        }

        if (navNavegacao && data.tipo) {
            renderizarNavegacao(
                navNavegacao,
                data.tipo.trim().toLowerCase()
            );
        }
    } catch (erro) {
        console.error('Erro ao carregar usuário:', erro);
    }
}


/* =====================================================
   EVENTOS
===================================================== */

if (btnAbrir) {
    btnAbrir.addEventListener('click', alternarMenu);
}

if (btnFechar) {
    btnFechar.addEventListener('click', alternarMenu);
}

if (mascara) {
    mascara.addEventListener('click', alternarMenu);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregarUsuario);
} else {
    carregarUsuario();
}
