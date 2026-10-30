/**
 * ARQUIVO: perfil_produtor/main.js
 * OBJETIVO: Página pública do produtor (/produtor/<id>)
 * Mostra dados do produtor, média e distribuição das notas,
 * as avaliações com comentários e os produtos à venda.
 */

const API_URL = CONFIG.API_URL;
const FOTO_USUARIO = "/static/assets/user.png";
const FOTO_PRODUTO = "/static/assets/produto_generico.png";

const { escaparHTML, formatarNota, formatarData, estrelas, resumo } = window.Avaliacoes;

const container = document.getElementById("conteudoPerfilProdutor");


// ============================================================
// BUSCA NA API
// ============================================================

async function buscarProdutor(id) {
    const res = await fetch(`${API_URL}/produtores/${id}`, {
        credentials: "include"
    });

    if (res.status === 401) {
        window.location.href = "/login";
        return null;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data?.detail?.erro || "Não foi possível carregar o perfil do produtor.");
    }

    return data;
}


// ============================================================
// PARTES DA PÁGINA
// ============================================================

function cabecalhoHTML(p) {
    return `
        <section class="pp-cabecalho">
            <img class="pp-foto" src="${escaparHTML(p.foto_perfil || FOTO_USUARIO)}" alt="Foto de ${escaparHTML(p.nome)}"
                 onerror="this.onerror=null; this.src='${FOTO_USUARIO}';">

            <div class="pp-dados">
                <span class="pp-etiqueta">Produtor</span>
                <h1>${escaparHTML(p.nome)}</h1>
                ${p.conta_excluida
                    ? `<span class="etiqueta-conta-excluida">Conta excluída</span>`
                    : `<p class="pp-local">
                    <i data-lucide="map-pin"></i>
                    ${escaparHTML(p.cidade || "Cidade não informada")}${p.estado ? `, ${escaparHTML(p.estado)}` : ""}
                </p>`}
                <div>${resumo(p.media_avaliacoes, p.total_avaliacoes, 20)}</div>
            </div>
        </section>`;
}

function notasHTML(p) {
    if (!p.total_avaliacoes) {
        return `
            <section class="pp-bloco">
                <h2>Avaliações</h2>
                <div class="sem-produtos pp-vazio">
                    <i data-lucide="star"></i>
                    <h2>Sem avaliações ainda</h2>
                    <p>Este produtor ainda não recebeu avaliações de estabelecimentos.</p>
                </div>
            </section>`;
    }

    // Barras de 5 a 1 estrela (meias estrelas entram junto com a estrela de cima: 4,5 conta em 5)
    const porEstrela = [5, 4, 3, 2, 1].map(n => {
        const total = (p.distribuicao[`${n}.0`] || 0) + (p.distribuicao[`${n - 0.5}`] || 0);
        const porcentagem = Math.round((total / p.total_avaliacoes) * 100);

        return `
            <div class="pp-barra">
                <span>${n} ★</span>
                <div class="pp-barra-fundo"><div class="pp-barra-cheia" style="width:${porcentagem}%"></div></div>
                <span>${total}</span>
            </div>`;
    }).join("");

    const lista = p.avaliacoes.map(a => `
        <article class="item-avaliacao">
            <div class="item-avaliacao-topo">
                <strong>${escaparHTML(a.avaliador_nome)}</strong>
                <span class="item-avaliacao-data">${formatarData(a.data)}</span>
            </div>
            <div>${estrelas(a.nota, 16)} <strong style="margin-left:4px;">${formatarNota(a.nota)}</strong></div>
            ${a.comentario ? `<p>${escaparHTML(a.comentario)}</p>` : ""}
        </article>`).join("");

    return `
        <section class="pp-bloco">
            <h2>Avaliações</h2>

            <div class="pp-notas">
                <div class="pp-media">
                    <span class="pp-media-numero">${formatarNota(p.media_avaliacoes)}</span>
                    ${estrelas(p.media_avaliacoes, 22)}
                    <span>${p.total_avaliacoes} ${p.total_avaliacoes === 1 ? "avaliação" : "avaliações"}</span>
                </div>
                <div class="pp-barras">${porEstrela}</div>
            </div>

            <div class="lista-avaliacoes">${lista}</div>
        </section>`;
}

function produtosHTML(p) {
    if (!p.produtos.length) {
        return `
            <section class="pp-bloco">
                <h2>Produtos à venda</h2>
                <p class="pp-texto-suave">Nenhum produto publicado no momento.</p>
            </section>`;
    }

    // O próprio produtor não pode comprar de si mesmo:
    // no perfil dele, os produtos levam para "Meus produtos"
    const ehMeuPerfil = Number(Auth.get()?.id) === Number(p.id);

    // Cada produto leva ao card dele no marketplace, onde dá para fazer o pedido
    const cards = p.produtos.map(prod => `
        <a class="pp-produto"
           href="${ehMeuPerfil ? "/meus_produtos" : `/marketplace?produto=${Number(prod.id)}`}"
           title="${ehMeuPerfil ? "Gerenciar meus produtos" : "Ver no marketplace e fazer pedido"}">
            <img src="${escaparHTML(prod.foto || FOTO_PRODUTO)}" alt="${escaparHTML(prod.nome)}"
                 onerror="this.onerror=null; this.src='${FOTO_PRODUTO}';">
            <div>
                <strong>${escaparHTML(prod.nome)}</strong>
                <span>R$ ${Number(prod.preco || 0).toFixed(2).replace(".", ",")} / ${escaparHTML(prod.unidade || "un")}</span>
                <span class="pp-produto-acao">${ehMeuPerfil ? "Gerenciar →" : "Ver e fazer pedido →"}</span>
            </div>
        </a>`).join("");

    return `
        <section class="pp-bloco">
            <h2>Produtos à venda</h2>
            <div class="pp-produtos">${cards}</div>
        </section>`;
}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function iniciar() {
    if (!Auth.get()) {
        window.location.href = "/login";
        return;
    }

    const id = Number(window.location.pathname.split("/").filter(Boolean).pop());

    try {
        const produtor = await buscarProdutor(id);
        if (!produtor) return;

        document.title = `${produtor.nome} | AgroLink`;
        container.innerHTML = cabecalhoHTML(produtor) + notasHTML(produtor) + produtosHTML(produtor);

    } catch (erro) {
        container.innerHTML = `
            <div class="sem-produtos">
                <i data-lucide="triangle-alert"></i>
                <h2>Perfil não encontrado</h2>
                <p>${escaparHTML(erro.message)}</p>
            </div>`;
    }

    if (window.lucide) window.lucide.createIcons();
}

iniciar();
