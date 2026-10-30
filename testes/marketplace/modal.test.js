import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

// Mock da API.
vi.mock("../../static/js/estabelecimentos/market_place_estabelecimentos/api.js", () => ({
    API: {
        enviarNegociacao: vi.fn()
    }
}));

describe("Modal de negociação", () => {
    let produto;
    let API;
    let abrirModal;
    let fecharModal;
    let emitirPedido;
    let getProdutoSelecionado;

    beforeEach(async () => {
        // Primeiro, cria o HTML.
        document.body.innerHTML = `
            <div id="orderModal">
                <span id="modalUnit"></span>

                <input id="inputQtd" type="number">
                <input id="inputData" type="date">
                <textarea id="inputDesc"></textarea>

                <span id="resumoProduto"></span>
                <span id="resumoProdutor"></span>
                <span id="resumoQtd"></span>
                <span id="resumoData"></span>
            </div>

            <div id="productsGrid"></div>
            <div id="resultsCount"></div>

            <input id="searchInput">
            <select id="filterCategory"></select>
            <select id="filterEstado"></select>
            <select id="filterCidade"></select>
            <input id="filterDistance">
            <span id="distLabel"></span>

            <div id="drawerOverlay"></div>
            <div id="sideDrawer"></div>
            <button class="menu-icon"></button>
            <button id="closeDrawerBtn"></button>
        `;

        // Limpa o cache dos módulos.
        // Isso faz com que o DOM seja capturado novamente.
        vi.resetModules();

        // Importa os módulos somente depois de criar o HTML.
        const apiModule = await import(
            "../../static/js/estabelecimentos/market_place_estabelecimentos/api.js"
        );

        const modalModule = await import(
            "../../static/js/estabelecimentos/market_place_estabelecimentos/modal.js"
        );

        const domModule = await import(
            "../../static/js/estabelecimentos/market_place_estabelecimentos/acesso_a_elementos_DOM.js"
        );

        API = apiModule.API;

        abrirModal = modalModule.abrirModal;
        fecharModal = modalModule.fecharModal;
        emitirPedido = modalModule.emitirPedido;

        getProdutoSelecionado = domModule.getProdutoSelecionado;

        produto = {
            id: 10,
            nome: "Milho",
            unidade: "sacas",
            produtor_nome: "João"
        };

        API.enviarNegociacao.mockReset();

        vi.spyOn(window, "alert").mockImplementation(() => {});
        vi.spyOn(console, "log").mockImplementation(() => {});

        // Agora o DOM já existe e pode ser acessado.
        fecharModal();
    });

    afterEach(() => {
        delete window.exibirNotificacao;
        vi.restoreAllMocks();
    });

    // =========================================
    // ABRIR MODAL
    // =========================================

    it("deve abrir o modal ao selecionar um produto", () => {
        abrirModal(produto);

        expect(
            document.getElementById("orderModal").classList.contains("active")
        ).toBe(true);

        expect(getProdutoSelecionado()).toEqual(produto);
    });

    it("não deve abrir o modal quando nenhum produto for informado", () => {
        abrirModal(null);

        expect(
            document.getElementById("orderModal").classList.contains("active")
        ).toBe(false);

        expect(getProdutoSelecionado()).toBeNull();
    });

    it("deve limpar os campos ao abrir o modal", () => {
        const qtd = document.getElementById("inputQtd");
        const data = document.getElementById("inputData");
        const desc = document.getElementById("inputDesc");

        qtd.value = "50";
        data.value = "2027-01-10";
        desc.value = "Pedido de teste";

        abrirModal(produto);

        expect(qtd.value).toBe("");
        expect(data.value).toBe("");
        expect(desc.value).toBe("");
    });

    it("deve definir a unidade do produto no modal", () => {
        abrirModal(produto);

        expect(
            document.getElementById("modalUnit").textContent
        ).toBe("sacas");
    });

    it("deve atualizar o resumo do produto", () => {
        abrirModal(produto);

        expect(
            document.getElementById("resumoProduto").textContent
        ).toBe("Milho");

        expect(
            document.getElementById("resumoProdutor").textContent
        ).toBe("João");

        expect(
            document.getElementById("resumoQtd").textContent
        ).toBe("- sacas");

        expect(
            document.getElementById("resumoData").textContent
        ).toBe("-");
    });

    it("deve usar Produtor Local quando o produto não tiver produtor_nome", () => {
        abrirModal({
            ...produto,
            produtor_nome: ""
        });

        expect(
            document.getElementById("resumoProdutor").textContent
        ).toBe("Produtor Local");
    });

    it("deve definir a data mínima como a data atual", () => {
        abrirModal(produto);

        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");

        expect(
            document.getElementById("inputData").min
        ).toBe(`${ano}-${mes}-${dia}`);
    });

    // =========================================
    // ATUALIZAÇÃO DO RESUMO
    // =========================================

    it("deve atualizar a quantidade no resumo ao digitar", () => {
        abrirModal(produto);

        const qtd = document.getElementById("inputQtd");

        qtd.value = "25";
        qtd.dispatchEvent(new Event("input"));

        expect(
            document.getElementById("resumoQtd").textContent
        ).toBe("25 sacas");
    });

    it("deve atualizar a data no resumo ao selecionar uma data", () => {
        abrirModal(produto);

        const data = document.getElementById("inputData");

        data.value = "2027-05-20";
        data.dispatchEvent(new Event("change"));

        expect(
            document.getElementById("resumoData").textContent
        ).toBe("20/05/2027");
    });

    // =========================================
    // FECHAR MODAL
    // =========================================

    it("deve fechar o modal e limpar o produto selecionado", () => {
        abrirModal(produto);
        fecharModal();

        expect(
            document.getElementById("orderModal").classList.contains("active")
        ).toBe(false);

        expect(getProdutoSelecionado()).toBeNull();
    });

    it("deve fechar o modal ao clicar fora de seu conteúdo", () => {
        abrirModal(produto);

        const modal = document.getElementById("orderModal");

        modal.dispatchEvent(
            new MouseEvent("click", {
                bubbles: true
            })
        );

        expect(modal.classList.contains("active")).toBe(false);
        expect(getProdutoSelecionado()).toBeNull();
    });

    // =========================================
    // VALIDAÇÕES DO PEDIDO
    // =========================================

    it("deve impedir o envio quando a quantidade estiver vazia", async () => {
        abrirModal(produto);

        document.getElementById("inputData").value = "2027-12-10";

        await emitirPedido();

        expect(window.alert).toHaveBeenCalledWith(
            "Por favor, preencha a quantidade e a data de entrega."
        );

        expect(API.enviarNegociacao).not.toHaveBeenCalled();
    });

    it("deve impedir o envio quando a data estiver vazia", async () => {
        abrirModal(produto);

        document.getElementById("inputQtd").value = "20";

        await emitirPedido();

        expect(window.alert).toHaveBeenCalledWith(
            "Por favor, preencha a quantidade e a data de entrega."
        );

        expect(API.enviarNegociacao).not.toHaveBeenCalled();
    });

    it("deve impedir o envio quando a data for anterior a hoje", async () => {
        abrirModal(produto);

        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);

        const ano = ontem.getFullYear();
        const mes = String(ontem.getMonth() + 1).padStart(2, "0");
        const dia = String(ontem.getDate()).padStart(2, "0");

        document.getElementById("inputQtd").value = "20";
        document.getElementById("inputData").value =
            `${ano}-${mes}-${dia}`;

        await emitirPedido();

        expect(window.alert).toHaveBeenCalledWith(
            "A data de entrega não pode ser anterior a hoje."
        );

        expect(API.enviarNegociacao).not.toHaveBeenCalled();
    });

    it("deve impedir o envio quando nenhum produto estiver selecionado", async () => {
        abrirModal(produto);
        fecharModal();

        document.getElementById("inputQtd").value = "20";
        document.getElementById("inputData").value = "2027-12-10";

        await emitirPedido();

        expect(window.alert).toHaveBeenCalledWith(
            "Nenhum produto foi selecionado."
        );

        expect(API.enviarNegociacao).not.toHaveBeenCalled();
    });

    // =========================================
    // ENVIO DA NEGOCIAÇÃO
    // =========================================

    it("deve enviar o pedido com os dados corretos", async () => {
        abrirModal(produto);

        document.getElementById("inputQtd").value = "25.5";
        document.getElementById("inputData").value = "2027-12-10";
        document.getElementById("inputDesc").value = "Entrega urgente";

        API.enviarNegociacao.mockResolvedValue({
            mensagem: "Pedido enviado"
        });

        window.exibirNotificacao = vi.fn();

        await emitirPedido();

        expect(API.enviarNegociacao).toHaveBeenCalledWith({
            produto_id: 10,
            quantidade: 25.5,
            data_entrega: "2027-12-10",
            descricao: "Entrega urgente"
        });

        expect(window.exibirNotificacao).toHaveBeenCalledWith(
            "cadastro",
            "Solicitação de pedido enviada com sucesso!"
        );

        expect(getProdutoSelecionado()).toBeNull();

        expect(
            document.getElementById("orderModal").classList.contains("active")
        ).toBe(false);
    });

    it("deve enviar descrição vazia quando nenhuma descrição for informada", async () => {
        abrirModal(produto);

        document.getElementById("inputQtd").value = "10";
        document.getElementById("inputData").value = "2027-12-10";

        API.enviarNegociacao.mockResolvedValue({});

        window.exibirNotificacao = vi.fn();

        await emitirPedido();

        expect(API.enviarNegociacao).toHaveBeenCalledWith({
            produto_id: 10,
            quantidade: 10,
            data_entrega: "2027-12-10",
            descricao: ""
        });
    });

    it("deve exibir notificação de erro quando a API falhar", async () => {
        abrirModal(produto);

        document.getElementById("inputQtd").value = "10";
        document.getElementById("inputData").value = "2027-12-10";

        API.enviarNegociacao.mockRejectedValue(
            new Error("Falha na API")
        );

        window.exibirNotificacao = vi.fn();

        await emitirPedido();

        expect(window.exibirNotificacao).toHaveBeenCalledWith(
            "erro",
            "Erro ao realizar pedido: Falha na API"
        );

        expect(
            document.getElementById("orderModal").classList.contains("active")
        ).toBe(true);
    });
});