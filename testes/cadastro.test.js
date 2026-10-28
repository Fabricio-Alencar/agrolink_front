
import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";

vi.mock("../static/js/perfil/telefone.js", () => ({
    formatarTelefone: vi.fn(valor => valor),
    telefoneValido: vi.fn(valor => {
        const numeros = String(valor || "").replace(/\D/g, "");
        return !numeros || numeros.length === 10 || numeros.length === 11;
    })
}));

import { telefoneValido } from "../static/js/perfil/telefone.js";

describe("Cadastro do Agrolink", () => {
    let form;
    let produtor;
    let estabelecimento;
    let alertar;

    beforeEach(async () => {
        document.body.innerHTML = `
            <button id="type-produtor" class="active"></button>
            <button id="type-estabelecimento"></button>

            <form id="register-form">
                <input id="fullname">
                <input id="email">
                <input id="phone">
                <input id="password" type="password">
                <input id="password_confirm" type="password">

                <select id="estado">
                    <option value="SP">São Paulo</option>
                </select>

                <select id="cidade">
                    <option value="Campinas">Campinas</option>
                </select>

                <div>
                    <input class="toggle-password" type="password">
                    <button type="button" class="toggle-password"></button>
                </div>

                <button type="submit">Cadastrar</button>
            </form>
        `;

        window.CONFIG = {
            API_URL: "http://localhost:5000"
        };

        window.lucide = {
            createIcons: vi.fn()
        };

        alertar = vi.fn().mockResolvedValue({});

        window.Swal = {
            fire: alertar
        };

        produtor = document.getElementById("type-produtor");
        estabelecimento = document.getElementById(
            "type-estabelecimento"
        );
        form = document.getElementById("register-form");

        document.getElementById("fullname").value = "Maria Silva";
        document.getElementById("email").value = "maria@email.com";
        document.getElementById("phone").value = "(11) 99999-9999";
        document.getElementById("password").value = "Senha123";
        document.getElementById("password_confirm").value = "Senha123";

        vi.mocked(telefoneValido).mockReturnValue(true);

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ id: 1 })
            })
        );

        vi.resetModules();
        await import("../static/js/cadastro/logica.js");
    });

    async function enviarCadastro() {
        form.dispatchEvent(
            new Event("submit", {
                bubbles: true,
                cancelable: true
            })
        );

        await vi.waitFor(() => {
            expect(alertar).toHaveBeenCalled();
        });
    }

    it("deve iniciar com produtor selecionado", () => {
        expect(produtor.classList.contains("active")).toBe(true);
        expect(estabelecimento.classList.contains("active")).toBe(false);
    });

    it("deve alternar para estabelecimento", () => {
        estabelecimento.click();

        expect(estabelecimento.classList.contains("active")).toBe(true);
        expect(produtor.classList.contains("active")).toBe(false);
    });

    it("deve impedir o cadastro com telefone inválido", async () => {
        vi.mocked(telefoneValido).mockReturnValue(false);

        await enviarCadastro();

        expect(fetch).not.toHaveBeenCalled();
        expect(alertar).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Telefone inválido"
            })
        );
    });

    it("deve impedir o cadastro quando as senhas forem diferentes", async () => {
        document.getElementById("password_confirm").value = "outraSenha";

        await enviarCadastro();

        expect(fetch).not.toHaveBeenCalled();
        expect(alertar).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Senhas diferentes"
            })
        );
    });

    it("deve enviar os dados corretos para a API", async () => {
        await enviarCadastro();

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:5000/cadastro",
            expect.objectContaining({
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    tipo: "produtor",
                    nome: "Maria Silva",
                    email: "maria@email.com",
                    telefone: "(11) 99999-9999",
                    estado: "SP",
                    cidade: "Campinas",
                    senha: "Senha123"
                })
            })
        );
    });

    it("deve exibir sucesso quando o cadastro funcionar", async () => {
        await enviarCadastro();

        expect(alertar).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: "success",
                title: "Cadastro realizado com sucesso!"
            })
        );
    });

    it("deve enviar o tipo estabelecimento quando selecionado", async () => {
        estabelecimento.click();

        await enviarCadastro();

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:5000/cadastro",
            expect.objectContaining({
                body: expect.stringContaining('"tipo":"estabelecimento"')
            })
        );
    });

    it("deve exibir erro quando a API rejeitar o cadastro", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: false,
                json: async () => ({
                    erro: "Email já cadastrado"
                })
            })
        );

        await enviarCadastro();

        expect(alertar).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: "error",
                title: "Email já cadastrado"
            })
        );
    });

    it("deve tratar falhas de comunicação", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockRejectedValue(new Error("Falha de conexão"))
        );

        await enviarCadastro();

        expect(alertar).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: "error",
                title: "Falha de conexão"
            })
        );
    });
});
