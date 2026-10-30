import { describe, it, expect, beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    buscarConversas: vi.fn(),
    verificarAcessoNegociacao: vi.fn(),
    iniciarConversa: vi.fn(),
    buscarNegociacao: vi.fn(),
    buscarMensagens: vi.fn(),

    setNegociacaoAtual: vi.fn(),
    setNegociacaoInfo: vi.fn(),

    conectarWebSocket: vi.fn(),
    renderizarMensagens: vi.fn(),
    confirmarMensagemEnviada: vi.fn(),

    atualizarInfoNegociacao: vi.fn(),
    fecharModalInfo: vi.fn(),

    montarSecoesConversas: vi.fn(),
    atualizarContadorArquivadas: vi.fn(),

    inicializarListaConversas: vi.fn(),
    criarItemConversa: vi.fn(),
    localizarItemConversa: vi.fn(),
    atualizarContadorItem: vi.fn(),

    obterDataUltimaMensagem: vi.fn(),
    obterDataValida: vi.fn(),
    conversaEstaArquivada: vi.fn()
}));

vi.mock("../../static/js/chat/api.js", () => ({
    API: {
        buscarConversas: mocks.buscarConversas,
        verificarAcessoNegociacao: mocks.verificarAcessoNegociacao,
        iniciarConversa: mocks.iniciarConversa,
        buscarNegociacao: mocks.buscarNegociacao,
        buscarMensagens: mocks.buscarMensagens
    }
}));

vi.mock("../../static/js/chat/estado.js", () => ({
    setNegociacaoAtual: mocks.setNegociacaoAtual,
    setNegociacaoInfo: mocks.setNegociacaoInfo
}));

vi.mock("../../static/js/chat/websocket.js", () => ({
    conectarWebSocket: mocks.conectarWebSocket
}));

vi.mock("../../static/js/chat/mensagens.js", () => ({
    renderizarMensagens: mocks.renderizarMensagens,
    confirmarMensagemEnviada: mocks.confirmarMensagemEnviada
}));

vi.mock("../../static/js/chat/info-negociacao.js", () => ({
    atualizarInfoNegociacao: mocks.atualizarInfoNegociacao,
    fecharModalInfo: mocks.fecharModalInfo
}));

vi.mock("../../static/js/chat/conversas-arquivadas.js", () => ({
    montarSecoesConversas: mocks.montarSecoesConversas,
    atualizarContadorArquivadas: mocks.atualizarContadorArquivadas
}));

vi.mock("../../static/js/chat/lista-conversas.js", () => ({
    inicializarListaConversas: mocks.inicializarListaConversas,
    criarItemConversa: mocks.criarItemConversa,
    localizarItemConversa: mocks.localizarItemConversa,
    atualizarContadorItem: mocks.atualizarContadorItem
}));

vi.mock("../../static/js/chat/utils.js", () => ({
    obterDataUltimaMensagem: mocks.obterDataUltimaMensagem,
    obterDataValida: mocks.obterDataValida,
    conversaEstaArquivada: mocks.conversaEstaArquivada
}));

describe("Conversas do chat", () => {
    let modulo;
    let secoes;
    let listaAtivas;
    let listaArquivadas;

    beforeEach(async () => {
        vi.resetModules();

        vi.clearAllMocks();

        document.body.innerHTML = `
            <div class="chat-container">
                <div id="listaConversas"></div>
                <div id="chatArea"></div>
                <div id="chatSemSelecao"></div>
                <span id="chatNome"></span>
                <span id="chatProduto"></span>
                <img id="chatFoto">
                <div id="mensagens"></div>
                <button id="btnVoltarChat"></button>
            </div>
        `;

        listaAtivas = document.createElement("div");
        listaArquivadas = document.createElement("div");

        secoes = {
            listaAtivas,
            listaArquivadas,
            secaoArquivadas: document.createElement("section"),
            conteudoArquivadas: document.createElement("div"),
            contadorArquivadas: document.createElement("span")
        };

        mocks.montarSecoesConversas.mockImplementation(lista => {
            lista.append(secoes.secaoArquivadas, listaAtivas);
            return secoes;
        });

        mocks.obterDataUltimaMensagem.mockImplementation(c => c.data_ultima_mensagem || null);
        mocks.obterDataValida.mockImplementation(data => data ? new Date(data) : null);
        mocks.conversaEstaArquivada.mockImplementation(c => c.arquivada === true);

        mocks.criarItemConversa.mockImplementation(conversa => {
            const item = document.createElement("button");
            item.className = "conversa-item";
            item.dataset.negociacaoId = conversa.negociacao_id;
            return item;
        });

        mocks.localizarItemConversa.mockImplementation(id =>
            document.querySelector(`[data-negociacao-id="${id}"]`)
        );

        mocks.buscarConversas.mockResolvedValue([]);
        mocks.verificarAcessoNegociacao.mockResolvedValue({});
        mocks.iniciarConversa.mockResolvedValue({});
        mocks.buscarNegociacao.mockResolvedValue({});
        mocks.buscarMensagens.mockResolvedValue([]);

        modulo = await import("../../static/js/chat/conversas.js");
    });

    it("deve inicializar a lista de conversas", () => {
        expect(mocks.inicializarListaConversas).toHaveBeenCalled();

        expect(mocks.inicializarListaConversas.mock.calls[0][0].elementoLista)
            .toBe(document.getElementById("listaConversas"));
    });

    it("deve lançar erro quando a lista de conversas não existir", async () => {
        document.getElementById("listaConversas").remove();

        vi.resetModules();
        modulo = await import("../../static/js/chat/conversas.js");

        await expect(modulo.carregarConversas()).rejects.toThrow(
            "O elemento listaConversas não foi encontrado."
        );
    });

    it("deve exibir aviso quando não houver conversas", async () => {
        mocks.buscarConversas.mockResolvedValue([]);

        const resultado = await modulo.carregarConversas();

        expect(resultado).toEqual([]);
        expect(document.querySelector(".chat-sem-conversas").textContent)
            .toBe("Nenhuma conversa ainda.");
    });

    it("deve criar seções para as conversas", async () => {
        mocks.buscarConversas.mockResolvedValue([
            { negociacao_id: 1 }
        ]);

        await modulo.carregarConversas();

        expect(mocks.montarSecoesConversas).toHaveBeenCalled();
    });

    it("deve separar conversas ativas e arquivadas", async () => {
        mocks.buscarConversas.mockResolvedValue([
            { negociacao_id: 1, arquivada: false },
            { negociacao_id: 2, arquivada: true }
        ]);

        await modulo.carregarConversas();

        expect(listaAtivas.querySelectorAll(".conversa-item")).toHaveLength(1);
        expect(listaArquivadas.querySelectorAll(".conversa-item")).toHaveLength(1);
    });

    it("deve exibir aviso quando não houver conversas ativas", async () => {
        mocks.buscarConversas.mockResolvedValue([
            { negociacao_id: 2, arquivada: true }
        ]);

        await modulo.carregarConversas();

        expect(listaAtivas.querySelector(".chat-sem-conversas")).not.toBeNull();
        expect(listaAtivas.textContent).toContain("Nenhuma conversa ativa.");
    });

    it("deve ordenar as conversas pela data mais recente", async () => {
        mocks.buscarConversas.mockResolvedValue([
            { negociacao_id: 1, data_ultima_mensagem: "2026-10-27T10:00:00Z" },
            { negociacao_id: 2, data_ultima_mensagem: "2026-10-29T10:00:00Z" }
        ]);

        const resultado = await modulo.carregarConversas();

        expect(resultado[0].negociacao_id).toBe(2);
        expect(resultado[1].negociacao_id).toBe(1);
    });

    it("deve limpar o estado da tela sem seleção", () => {
        document.getElementById("chatArea").style.display = "flex";
        document.getElementById("chatSemSelecao").style.display = "none";
        document.getElementById("mensagens").innerHTML = "<p>Mensagem</p>";

        const item = document.createElement("button");
        item.className = "conversa-item ativa";
        document.body.appendChild(item);

        modulo.mostrarEstadoSemSelecao();

        expect(mocks.setNegociacaoAtual).toHaveBeenCalledWith(null);
        expect(mocks.setNegociacaoInfo).toHaveBeenCalledWith(null);
        expect(mocks.fecharModalInfo).toHaveBeenCalled();
        expect(document.getElementById("chatArea").style.display).toBe("none");
        expect(document.getElementById("chatSemSelecao").style.display).toBe("flex");
        expect(document.getElementById("mensagens").children).toHaveLength(0);
        expect(item.classList.contains("ativa")).toBe(false);
    });

    it("deve rejeitar identificador inválido ao abrir conversa", async () => {
        await expect(modulo.abrirConversa(0)).rejects.toThrow(
            "Identificador de negociação inválido."
        );

        await expect(modulo.abrirConversa("abc")).rejects.toThrow(
            "Identificador de negociação inválido."
        );
    });

    it("deve verificar acesso antes de iniciar a conversa", async () => {
        mocks.buscarNegociacao.mockResolvedValue({
            negociante_nome: "João",
            produto_nome: "Milho"
        });

        await modulo.abrirConversa(10);

        expect(mocks.verificarAcessoNegociacao).toHaveBeenCalledWith(10);
        expect(mocks.iniciarConversa).toHaveBeenCalledWith(10);
        expect(mocks.buscarNegociacao).toHaveBeenCalledWith(10);
    });

    it("deve atualizar os dados da negociação", async () => {
        const detalhes = {
            negociante_nome: "João",
            produto_nome: "Milho"
        };

        mocks.buscarNegociacao.mockResolvedValue(detalhes);

        await modulo.abrirConversa(10);

        expect(mocks.setNegociacaoAtual).toHaveBeenCalledWith(10);
        expect(mocks.setNegociacaoInfo).toHaveBeenCalledWith(detalhes);
        expect(mocks.atualizarInfoNegociacao).toHaveBeenCalledWith(detalhes);
    });

    it("deve exibir a área do chat", async () => {
        await modulo.abrirConversa(10);

        expect(document.getElementById("chatArea").style.display).toBe("flex");
        expect(document.getElementById("chatSemSelecao").style.display).toBe("none");
        expect(document.querySelector(".chat-container").classList.contains("chat-aberto")).toBe(true);
    });

    it("deve preencher nome e produto da conversa", async () => {
        mocks.buscarNegociacao.mockResolvedValue({
            negociante_nome: "Maria",
            produto_nome: "Soja"
        });

        await modulo.abrirConversa(10);

        expect(document.getElementById("chatNome").textContent).toBe("Maria");
        expect(document.getElementById("chatProduto").textContent).toBe("Soja");
    });

    it("deve utilizar valores padrão quando nome e produto estiverem ausentes", async () => {
        await modulo.abrirConversa(10);

        expect(document.getElementById("chatNome").textContent).toBe("Conversa");
        expect(document.getElementById("chatProduto").textContent).toBe("Negociação");
    });

    it("deve renderizar as mensagens retornadas pela API", async () => {
        const mensagens = [
            { id: 1, texto: "Olá" }
        ];

        mocks.buscarMensagens.mockResolvedValue(mensagens);

        await modulo.abrirConversa(10);

        expect(mocks.renderizarMensagens).toHaveBeenCalledWith(mensagens);
    });

    it("deve conectar o WebSocket da negociação", async () => {
        await modulo.abrirConversa(10);

        expect(mocks.conectarWebSocket).toHaveBeenCalledWith(
            10,
            expect.objectContaining({
                onMensagemConfirmada: mocks.confirmarMensagemEnviada
            })
        );
    });

    it("deve marcar somente a conversa selecionada como ativa", async () => {
        const primeiro = document.createElement("button");
        primeiro.className = "conversa-item";
        primeiro.dataset.negociacaoId = "10";

        const segundo = document.createElement("button");
        segundo.className = "conversa-item ativa";
        segundo.dataset.negociacaoId = "20";

        document.body.append(primeiro, segundo);

        await modulo.abrirConversa(10);

        expect(primeiro.classList.contains("ativa")).toBe(true);
        expect(segundo.classList.contains("ativa")).toBe(false);
    });

    it("deve voltar para a lista ao clicar no botão voltar", async () => {
        await modulo.abrirConversa(10);

        document.getElementById("btnVoltarChat").click();

        expect(mocks.fecharModalInfo).toHaveBeenCalled();
        expect(document.getElementById("chatArea").style.display).toBe("none");
        expect(document.querySelector(".chat-container").classList.contains("chat-aberto")).toBe(false);
    });
});