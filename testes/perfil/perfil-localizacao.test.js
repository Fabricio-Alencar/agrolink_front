
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi
} from "vitest";

async function prepararLocalizacao() {
    vi.resetModules();

    document.body.innerHTML = `
        <select id="profile-state"></select>
        <select id="profile-city"></select>
    `;

    return await import("../../static/js/perfil/localizacao.js");
}

describe("Localização do perfil", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());

        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("deve carregar os estados brasileiros", async () => {
        const { carregarEstados } = await prepararLocalizacao();

        fetch.mockResolvedValue({
            ok: true,
            json: async () => [
                { sigla: "SP", nome: "São Paulo" },
                { sigla: "RJ", nome: "Rio de Janeiro" }
            ]
        });

        await carregarEstados();

        const estado = document.getElementById("profile-state");

        expect(fetch).toHaveBeenCalledWith(
            "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
        );

        expect(estado.options).toHaveLength(3);
        expect(estado.options[0].textContent).toBe(
            "Selecione o estado"
        );
        expect(estado.options[1].value).toBe("SP");
        expect(estado.options[1].textContent).toBe("São Paulo");
    });

    it("deve mostrar mensagem quando falhar ao carregar estados", async () => {
        const { carregarEstados } = await prepararLocalizacao();

        fetch.mockResolvedValue({
            ok: false
        });

        await carregarEstados();

        const estado = document.getElementById("profile-state");

        expect(estado.innerHTML).toContain(
            "Erro ao carregar estados"
        );
        expect(console.error).toHaveBeenCalled();
    });

    it("deve tratar falha de comunicação ao carregar estados", async () => {
        const { carregarEstados } = await prepararLocalizacao();

        fetch.mockRejectedValue(new Error("Falha de conexão"));

        await carregarEstados();

        expect(
            document.getElementById("profile-state").innerHTML
        ).toContain("Erro ao carregar estados");
    });

    it("deve retornar sem fazer requisição quando o campo de estado não existir", async () => {
        document.body.innerHTML = "";

        vi.resetModules();

        const { carregarEstados } = await import(
            "../../static/js/perfil/localizacao.js"
        );

        await carregarEstados();

        expect(fetch).not.toHaveBeenCalled();
    });

    it("deve carregar as cidades de um estado", async () => {
        const { carregarCidades } = await prepararLocalizacao();

        fetch.mockResolvedValue({
            ok: true,
            json: async () => [
                { nome: "Campinas" },
                { nome: "Santos" }
            ]
        });

        await carregarCidades("SP");

        const cidade = document.getElementById("profile-city");

        expect(fetch).toHaveBeenCalledWith(
            "https://servicodados.ibge.gov.br/api/v1/localidades/estados/SP/municipios"
        );

        expect(cidade.options).toHaveLength(3);
        expect(cidade.options[0].textContent).toBe(
            "Selecione a cidade"
        );
        expect(cidade.options[1].value).toBe("Campinas");
        expect(cidade.options[2].value).toBe("Santos");
        expect(cidade.disabled).toBe(false);
    });

    it("deve selecionar a cidade informada", async () => {
        const { carregarCidades } = await prepararLocalizacao();

        fetch.mockResolvedValue({
            ok: true,
            json: async () => [
                { nome: "Campinas" },
                { nome: "Santos" }
            ]
        });

        await carregarCidades("SP", "Santos");

        expect(
            document.getElementById("profile-city").value
        ).toBe("Santos");
    });

    it("não deve carregar cidades quando a UF não for informada", async () => {
        const { carregarCidades } = await prepararLocalizacao();

        await carregarCidades("");

        expect(fetch).not.toHaveBeenCalled();
    });

    it("deve retornar quando o campo de cidade não existir", async () => {
        document.body.innerHTML = `
            <select id="profile-state"></select>
        `;

        vi.resetModules();

        const { carregarCidades } = await import(
            "../../static/js/perfil/localizacao.js"
        );

        await carregarCidades("SP");

        expect(fetch).not.toHaveBeenCalled();
    });

    it("deve tratar erro ao carregar cidades", async () => {
        const { carregarCidades } = await prepararLocalizacao();

        fetch.mockResolvedValue({
            ok: false
        });

        await carregarCidades("SP");

        const cidade = document.getElementById("profile-city");

        expect(cidade.innerHTML).toContain(
            "Erro ao carregar cidades"
        );
        expect(cidade.disabled).toBe(true);
        expect(console.error).toHaveBeenCalled();
    });

    it("deve tratar falha de comunicação ao carregar cidades", async () => {
        const { carregarCidades } = await prepararLocalizacao();

        fetch.mockRejectedValue(new Error("Falha de conexão"));

        await carregarCidades("SP");

        expect(
            document.getElementById("profile-city").disabled
        ).toBe(true);
    });

    it("deve configurar a mudança de estado e carregar cidades", async () => {
        const {
            configurarLocalizacao
        } = await prepararLocalizacao();

        fetch.mockResolvedValue({
            ok: true,
            json: async () => [
                { nome: "Campinas" },
                { nome: "Santos" }
            ]
        });

        const estado = document.getElementById("profile-state");
        const cidade = document.getElementById("profile-city");

        estado.innerHTML = `
            <option value="">Selecione</option>
            <option value="SP">São Paulo</option>
        `;

        configurarLocalizacao();

        estado.value = "SP";
        estado.dispatchEvent(new Event("change"));

        await vi.waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                "https://servicodados.ibge.gov.br/api/v1/localidades/estados/SP/municipios"
            );
        });

        expect(cidade.disabled).toBe(false);
    });

    it("deve desabilitar cidades quando o estado for limpo", async () => {
        const {
            configurarLocalizacao
        } = await prepararLocalizacao();

        const estado = document.getElementById("profile-state");
        const cidade = document.getElementById("profile-city");

        estado.innerHTML = `
            <option value="">Selecione</option>
            <option value="SP">São Paulo</option>
        `;

        configurarLocalizacao();

        estado.value = "";
        estado.dispatchEvent(new Event("change"));

        expect(cidade.disabled).toBe(true);
        expect(cidade.value).toBe("");
        expect(fetch).not.toHaveBeenCalled();
    });

    it("deve preencher estado e cidade selecionados", async () => {
        const {
            preencherLocalizacao
        } = await prepararLocalizacao();

        fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    { sigla: "SP", nome: "São Paulo" },
                    { sigla: "RJ", nome: "Rio de Janeiro" }
                ]
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    { nome: "Campinas" },
                    { nome: "Santos" }
                ]
            });

        await preencherLocalizacao("SP", "Santos");

        const estado = document.getElementById("profile-state");
        const cidade = document.getElementById("profile-city");

        expect(estado.value).toBe("SP");
        expect(cidade.value).toBe("Santos");
        expect(estado.disabled).toBe(true);
        expect(cidade.disabled).toBe(true);
    });

    it("deve desabilitar a localização quando não houver estado salvo", async () => {
        const {
            preencherLocalizacao
        } = await prepararLocalizacao();

        fetch.mockResolvedValue({
            ok: true,
            json: async () => [
                { sigla: "SP", nome: "São Paulo" }
            ]
        });

        await preencherLocalizacao("", "");

        const estado = document.getElementById("profile-state");
        const cidade = document.getElementById("profile-city");

        expect(estado.disabled).toBe(true);
        expect(cidade.disabled).toBe(true);
        expect(cidade.innerHTML).toContain(
            "Selecione o estado primeiro"
        );
    });

    it("deve retornar ao preencher localização sem os campos necessários", async () => {
        document.body.innerHTML = "";

        vi.resetModules();

        const { preencherLocalizacao } = await import(
            "../../static/js/perfil/localizacao.js"
        );

        await preencherLocalizacao("SP", "Santos");

        expect(fetch).not.toHaveBeenCalled();
    });
});
