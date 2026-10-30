
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

const caminhoModulo =
    "../../static/js/estabelecimentos/market_place_estabelecimentos/localizacao.js";

describe("Localização do Marketplace", () => {

    let estados;
    let cidades;

    beforeEach(() => {

        // Limpa o cache para executar novamente a inicialização do módulo.
        vi.resetModules();

        // Cria os elementos utilizados pelo arquivo de produção.
        document.body.innerHTML = `
            <select id="filterEstado">
                <option value="">Todos</option>
            </select>

            <select id="filterCidade">
                <option value="">Todos</option>
            </select>
        `;

        estados = [
            { nome: "São Paulo", sigla: "SP" },
            { nome: "Rio de Janeiro", sigla: "RJ" },
            { nome: "Minas Gerais", sigla: "MG" }
        ];

        cidades = [
            { nome: "Campinas" },
            { nome: "Santos" },
            { nome: "Ribeirão Preto" }
        ];

        // Simula as respostas da API do IBGE.
        global.fetch = vi.fn(async (url) => {

            if (url.includes("/estados?")) {
                return {
                    json: vi.fn().mockResolvedValue(estados)
                };
            }

            if (url.includes("/municipios")) {
                return {
                    json: vi.fn().mockResolvedValue(cidades)
                };
            }

            throw new Error("URL não reconhecida");
        });

    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("deve carregar os estados ao inicializar o módulo", async () => {

        await import(caminhoModulo);

        // Aguarda a execução da chamada assíncrona inicial.
        await vi.waitFor(() => {
            expect(document.querySelectorAll("#filterEstado option"))
                .toHaveLength(4);
        });

        const estadoSelect = document.getElementById("filterEstado");

        expect(estadoSelect.options[0].value).toBe("");
        expect(estadoSelect.options[1].value).toBe("SP");
        expect(estadoSelect.options[2].value).toBe("RJ");
        expect(estadoSelect.options[3].value).toBe("MG");

    });

    it("deve exibir o nome e a sigla dos estados", async () => {

        await import(caminhoModulo);

        await vi.waitFor(() => {
            expect(document.querySelectorAll("#filterEstado option"))
                .toHaveLength(4);
        });

        const estadoSelect = document.getElementById("filterEstado");

        expect(estadoSelect.options[1].textContent)
            .toBe("São Paulo (SP)");

        expect(estadoSelect.options[2].textContent)
            .toBe("Rio de Janeiro (RJ)");

    });

    it("deve consultar as cidades ao selecionar um estado", async () => {

        await import(caminhoModulo);

        await vi.waitFor(() => {
            expect(document.querySelectorAll("#filterEstado option"))
                .toHaveLength(4);
        });

        const estadoSelect = document.getElementById("filterEstado");

        estadoSelect.value = "SP";

        estadoSelect.dispatchEvent(
            new Event("change")
        );

        await vi.waitFor(() => {
            expect(document.querySelectorAll("#filterCidade option"))
                .toHaveLength(4);
        });

        expect(global.fetch).toHaveBeenCalledWith(
            "https://servicodados.ibge.gov.br/api/v1/localidades/estados/SP/municipios"
        );

    });

    it("deve adicionar as cidades retornadas pela API", async () => {

        await import(caminhoModulo);

        await vi.waitFor(() => {
            expect(document.querySelectorAll("#filterEstado option"))
                .toHaveLength(4);
        });

        const estadoSelect = document.getElementById("filterEstado");
        const cidadeSelect = document.getElementById("filterCidade");

        estadoSelect.value = "SP";

        estadoSelect.dispatchEvent(
            new Event("change")
        );

        await vi.waitFor(() => {
            expect(cidadeSelect.options).toHaveLength(4);
        });

        expect(cidadeSelect.options[0].value).toBe("");
        expect(cidadeSelect.options[0].textContent).toBe("Todos");

        expect(cidadeSelect.options[1].value).toBe("Campinas");
        expect(cidadeSelect.options[2].value).toBe("Santos");
        expect(cidadeSelect.options[3].value).toBe("Ribeirão Preto");

    });

    it("deve limpar as cidades quando nenhum estado estiver selecionado", async () => {

        await import(caminhoModulo);

        await vi.waitFor(() => {
            expect(document.querySelectorAll("#filterEstado option"))
                .toHaveLength(4);
        });

        const estadoSelect = document.getElementById("filterEstado");
        const cidadeSelect = document.getElementById("filterCidade");

        // Primeiro seleciona um estado.
        estadoSelect.value = "SP";
        estadoSelect.dispatchEvent(new Event("change"));

        await vi.waitFor(() => {
            expect(cidadeSelect.options).toHaveLength(4);
        });

        // Depois remove a seleção do estado.
        estadoSelect.value = "";
        estadoSelect.dispatchEvent(new Event("change"));

        expect(cidadeSelect.options).toHaveLength(1);
        expect(cidadeSelect.options[0].value).toBe("");
        expect(cidadeSelect.options[0].textContent).toBe("Todos");

    });

    it("deve exibir Carregando enquanto consulta as cidades", async () => {

        let resolverCidades;

        global.fetch = vi.fn((url) => {

            if (url.includes("/estados?")) {
                return Promise.resolve({
                    json: () => Promise.resolve(estados)
                });
            }

            if (url.includes("/municipios")) {
                return new Promise(resolve => {
                    resolverCidades = resolve;
                });
            }

        });

        await import(caminhoModulo);

        await vi.waitFor(() => {
            expect(document.querySelectorAll("#filterEstado option"))
                .toHaveLength(4);
        });

        const estadoSelect = document.getElementById("filterEstado");
        const cidadeSelect = document.getElementById("filterCidade");

        estadoSelect.value = "SP";
        estadoSelect.dispatchEvent(new Event("change"));

        expect(cidadeSelect.options[0].textContent)
            .toBe("Carregando...");

        resolverCidades({
            json: () => Promise.resolve(cidades)
        });

        await vi.waitFor(() => {
            expect(cidadeSelect.options).toHaveLength(4);
        });

    });

});
