/**
 * ARQUIVO: avaliacoes.js
 * OBJETIVO: Tudo que é comum às avaliações de produtores (0,5 a 5 estrelas)
 * - desenhar estrelas (cheias, meias e vazias)
 * - texto de resumo ("4,5 (12 avaliações)" ou "Sem avaliações")
 * - modal "Avalie este pedido", aberto quando o estabelecimento confirma o recebimento
 *
 * É um script comum (não módulo): fica disponível como window.Avaliacoes
 */

const Avaliacoes = (() => {

    const COR_CHEIA = "#f5b301";
    const COR_VAZIA = "#dcdcdc";
    const CAMINHO_ESTRELA = "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";
    const TAMANHO_MAXIMO_COMENTARIO = 500;

    const LEGENDAS = {
        0.5: "Muito ruim", 1: "Muito ruim",
        1.5: "Ruim", 2: "Ruim",
        2.5: "Regular", 3: "Regular",
        3.5: "Bom", 4: "Bom",
        4.5: "Muito bom", 5: "Excelente"
    };

    let contadorGradiente = 0;


    // ==========================================
    // UTILITÁRIOS
    // ==========================================

    // Comentários são escritos pelos usuários: sempre escapar antes de pôr no HTML
    function escaparHTML(texto) {
        return String(texto ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatarNota(nota) {
        return Number(nota).toFixed(1).replace(".", ",");
    }

    function formatarData(iso) {
        if (!iso) return "";
        const data = new Date(iso);
        return isNaN(data) ? "" : data.toLocaleDateString("pt-BR");
    }


    // ==========================================
    // ESTRELAS (SOMENTE LEITURA)
    // ==========================================

    function svgEstrela(preenchimento, tamanho) {
        if (preenchimento === "meia") {
            const id = `meiaEstrela${++contadorGradiente}`;
            return `
                <svg width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" aria-hidden="true">
                    <defs>
                        <linearGradient id="${id}">
                            <stop offset="50%" stop-color="${COR_CHEIA}"/>
                            <stop offset="50%" stop-color="${COR_VAZIA}"/>
                        </linearGradient>
                    </defs>
                    <path fill="url(#${id})" d="${CAMINHO_ESTRELA}"/>
                </svg>`;
        }

        const cor = preenchimento === "cheia" ? COR_CHEIA : COR_VAZIA;
        return `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" aria-hidden="true"><path fill="${cor}" d="${CAMINHO_ESTRELA}"/></svg>`;
    }

    /**
     * @param {number|null} nota  0,5 a 5 (null/0 = estrelas vazias)
     */
    function estrelas(nota, tamanho = 16) {
        const valor = Number(nota) || 0;
        let html = `<span class="estrelas" role="img" aria-label="${valor ? formatarNota(valor) + " de 5 estrelas" : "Sem avaliações"}">`;

        for (let i = 1; i <= 5; i++) {
            if (valor >= i) html += svgEstrela("cheia", tamanho);
            else if (valor >= i - 0.5) html += svgEstrela("meia", tamanho);
            else html += svgEstrela("vazia", tamanho);
        }

        return html + "</span>";
    }

    /**
     * Estrelas + texto. Produtor sem avaliações mostra 0 estrelas e "Sem avaliações".
     */
    function resumo(media, total, tamanho = 16) {
        if (media === null || media === undefined || !total) {
            return `
                <span class="avaliacao-resumo sem-avaliacoes">
                    ${estrelas(0, tamanho)}
                    <span class="avaliacao-texto">Sem avaliações</span>
                </span>`;
        }

        return `
            <span class="avaliacao-resumo">
                ${estrelas(media, tamanho)}
                <span class="avaliacao-texto">
                    <strong>${formatarNota(media)}</strong>
                    (${total} ${total === 1 ? "avaliação" : "avaliações"})
                </span>
            </span>`;
    }


    // ==========================================
    // SELETOR DE ESTRELAS (MEIA EM MEIA)
    // ==========================================

    function criarSeletor(container, aoMudar) {
        let nota = 0;

        container.innerHTML = "";
        container.className = "seletor-estrelas";
        container.tabIndex = 0;
        container.setAttribute("role", "slider");
        container.setAttribute("aria-label", "Nota de 0,5 a 5 estrelas");
        container.setAttribute("aria-valuemin", "0.5");
        container.setAttribute("aria-valuemax", "5");

        const botoes = [];

        for (let i = 1; i <= 5; i++) {
            const estrela = document.createElement("span");
            estrela.className = "seletor-estrela";
            estrela.dataset.valor = i;
            container.appendChild(estrela);
            botoes.push(estrela);
        }

        const pintar = (valor) => {
            botoes.forEach((estrela, indice) => {
                const posicao = indice + 1;
                const tipo = valor >= posicao ? "cheia" : valor >= posicao - 0.5 ? "meia" : "vazia";
                estrela.innerHTML = svgEstrela(tipo, 40);
            });
        };

        // Metade esquerda da estrela = meia estrela; metade direita = estrela inteira
        const valorDoPonteiro = (evento, estrela) => {
            const caixa = estrela.getBoundingClientRect();
            const inteira = Number(estrela.dataset.valor);
            return evento.clientX - caixa.left < caixa.width / 2 ? inteira - 0.5 : inteira;
        };

        const definir = (valor) => {
            nota = Math.min(5, Math.max(0.5, valor));
            container.setAttribute("aria-valuenow", String(nota));
            container.setAttribute("aria-valuetext", `${formatarNota(nota)} estrelas`);
            pintar(nota);
            aoMudar(nota);
        };

        botoes.forEach(estrela => {
            estrela.addEventListener("mousemove", (e) => pintar(valorDoPonteiro(e, estrela)));
            estrela.addEventListener("click", (e) => definir(valorDoPonteiro(e, estrela)));
        });

        container.addEventListener("mouseleave", () => pintar(nota));

        // Teclado: setas mudam de meia em meia estrela
        container.addEventListener("keydown", (e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); definir((nota || 0) + 0.5); }
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); definir((nota || 1) - 0.5); }
        });

        pintar(0);
    }


    // ==========================================
    // MODAL "AVALIE ESTE PEDIDO"
    // ==========================================

    function garantirModal() {
        let modal = document.getElementById("modalAvaliacao");
        if (modal) return modal;

        modal = document.createElement("div");
        modal.id = "modalAvaliacao";
        modal.className = "modal-avaliacao";
        modal.innerHTML = `
            <div class="modal-avaliacao-conteudo" role="dialog" aria-modal="true" aria-labelledby="tituloAvaliacao">
                <button type="button" class="modal-avaliacao-fechar" aria-label="Fechar">&times;</button>

                <div class="modal-avaliacao-icone">⭐</div>
                <h2 id="tituloAvaliacao">Avalie este pedido</h2>
                <p class="modal-avaliacao-subtitulo" id="subtituloAvaliacao"></p>

                <div id="seletorAvaliacao"></div>
                <p class="modal-avaliacao-legenda" id="legendaAvaliacao">Toque nas estrelas para dar sua nota</p>

                <label class="modal-avaliacao-label" for="comentarioAvaliacao">Comentário (opcional)</label>
                <textarea
                    id="comentarioAvaliacao"
                    maxlength="${TAMANHO_MAXIMO_COMENTARIO}"
                    placeholder="Como foi a qualidade dos produtos, a entrega e o atendimento?"
                ></textarea>
                <span class="modal-avaliacao-contador" id="contadorAvaliacao">0/${TAMANHO_MAXIMO_COMENTARIO}</span>

                <p class="modal-avaliacao-aviso">A avaliação não pode ser alterada depois de enviada.</p>

                <div class="modal-avaliacao-botoes">
                    <button type="button" class="btn-avaliar-depois" id="btnAvaliarDepois">Avaliar depois</button>
                    <button type="button" class="btn-enviar-avaliacao" id="btnEnviarAvaliacao" disabled>Enviar avaliação</button>
                </div>
            </div>`;

        document.body.appendChild(modal);
        return modal;
    }

    /**
     * Abre o modal. onEnviar(nota, comentario) deve retornar uma Promise;
     * se ela rejeitar, a mensagem de erro aparece e o modal continua aberto.
     */
    function abrirModal({ subtitulo = "", onEnviar, onFechar } = {}) {
        const modal = garantirModal();
        const comentario = modal.querySelector("#comentarioAvaliacao");
        const contador = modal.querySelector("#contadorAvaliacao");
        const legenda = modal.querySelector("#legendaAvaliacao");
        const btnEnviar = modal.querySelector("#btnEnviarAvaliacao");
        let notaEscolhida = 0;

        modal.querySelector("#subtituloAvaliacao").textContent = subtitulo;
        comentario.value = "";
        contador.textContent = `0/${TAMANHO_MAXIMO_COMENTARIO}`;
        legenda.textContent = "Toque nas estrelas para dar sua nota";
        btnEnviar.disabled = true;
        btnEnviar.textContent = "Enviar avaliação";

        criarSeletor(modal.querySelector("#seletorAvaliacao"), (nota) => {
            notaEscolhida = nota;
            legenda.textContent = `${formatarNota(nota)} · ${LEGENDAS[nota]}`;
            btnEnviar.disabled = false;
        });

        comentario.oninput = () => {
            contador.textContent = `${comentario.value.length}/${TAMANHO_MAXIMO_COMENTARIO}`;
        };

        const fechar = () => {
            modal.classList.remove("ativo");
            document.removeEventListener("keydown", aoTeclar);
            if (onFechar) onFechar();
        };

        const aoTeclar = (e) => { if (e.key === "Escape") fechar(); };

        modal.querySelector(".modal-avaliacao-fechar").onclick = fechar;
        modal.querySelector("#btnAvaliarDepois").onclick = fechar;
        modal.onclick = (e) => { if (e.target === modal) fechar(); };
        document.addEventListener("keydown", aoTeclar);

        btnEnviar.onclick = async () => {
            if (!notaEscolhida) return;

            btnEnviar.disabled = true;
            btnEnviar.textContent = "Enviando...";

            try {
                await onEnviar(notaEscolhida, comentario.value.trim());
                modal.classList.remove("ativo");
                document.removeEventListener("keydown", aoTeclar);
            } catch (erro) {
                btnEnviar.disabled = false;
                btnEnviar.textContent = "Enviar avaliação";
                if (typeof exibirNotificacao === "function") {
                    exibirNotificacao("erro", erro.message || "Não foi possível enviar a avaliação.");
                }
            }
        };

        modal.classList.add("ativo");
        modal.querySelector("#seletorAvaliacao").focus();
    }


    return {
        estrelas,
        resumo,
        formatarNota,
        formatarData,
        escaparHTML,
        abrirModal,
        TAMANHO_MAXIMO_COMENTARIO
    };
})();

window.Avaliacoes = Avaliacoes;
