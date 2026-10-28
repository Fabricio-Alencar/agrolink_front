
import {
    describe,
    it,
    expect,
    beforeAll,
    beforeEach,
    vi
} from "vitest";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let Auth;

describe("Auth", () => {
    beforeAll(() => {
        const caminho = resolve(
            process.cwd(),
            "static/js/auth.js"
        );

        const codigo = readFileSync(caminho, "utf8");

        // Executa o arquivo original no ambiente de navegador simulado.
        window.eval(codigo);

        Auth = window.Auth;

        
    },
    
    it("deve remover o usuário e o token ao fazer logout", () => {
        localStorage.setItem("user", JSON.stringify({
            id: 1,
            nome: "Maria",
            tipo: "produtor"
        }));

        localStorage.setItem("access_token", "token-ficticio");

        Auth.logout();

        expect(localStorage.getItem("user")).toBeNull();
        expect(localStorage.getItem("access_token")).toBeNull();
    }),

    it("deve desconectar os WebSockets quando a função existir", () => {
        const desconectar = vi.fn();
        window.desconectarWebSockets = desconectar;

        Auth.logout();

        expect(desconectar).toHaveBeenCalledTimes(1);

        delete window.desconectarWebSockets;
    }),

    it("deve funcionar sem a função de desconectar WebSockets", () => {
        delete window.desconectarWebSockets;

        expect(() => Auth.logout()).not.toThrow();

        expect(localStorage.getItem("user")).toBeNull();
        expect(localStorage.getItem("access_token")).toBeNull();
    }),

    it("deve limpar o cookie access_token", () => {
        document.cookie = "access_token=token-ficticio; path=/";

        Auth.logout();

        expect(document.cookie).not.toContain(
            "access_token=token-ficticio"
        );
    }),
);

    beforeEach(() => {
        localStorage.clear();
    });

    it("deve disponibilizar Auth globalmente", () => {
        expect(Auth).toBeDefined();
    });

    it("deve salvar um usuário no localStorage", () => {
        const usuario = {
            id: 1,
            tipo: "produtor",
            nome: "Maria"
        };

        Auth.save(usuario);

        expect(
            JSON.parse(localStorage.getItem("user"))
        ).toEqual(usuario);
    });

    it("deve recuperar um usuário salvo", () => {
        const usuario = {
            id: 2,
            tipo: "admin",
            nome: "João"
        };

        Auth.save(usuario);

        expect(Auth.get()).toEqual(usuario);
    });

    it("deve retornar null quando não houver usuário", () => {
        expect(Auth.get()).toBeNull();
    });

    it("deve retornar null se o JSON estiver inválido", () => {
        localStorage.setItem("user", "{json inválido");

        const erroOriginal = console.error;
        const erroMock = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        expect(Auth.get()).toBeNull();
        expect(erroMock).toHaveBeenCalled();

        erroMock.mockRestore();
        console.error = erroOriginal;
    });

    it("deve indicar que o usuário está logado", () => {
        Auth.save({
            id: 1,
            tipo: "produtor",
            nome: "Maria"
        });

        expect(Auth.isLogged()).toBe(true);
    });

    it("deve indicar que o usuário não está logado", () => {
        expect(Auth.isLogged()).toBe(false);
    });

    it("deve retornar o ID do usuário", () => {
        Auth.save({
            id: 10,
            tipo: "admin",
            nome: "João"
        });

        expect(Auth.getId()).toBe(10);
    });

    it("deve retornar o tipo do usuário", () => {
        Auth.save({
            id: 10,
            tipo: "admin",
            nome: "João"
        });

        expect(Auth.getType()).toBe("admin");
    });

    it("deve retornar o nome do usuário", () => {
        Auth.save({
            id: 10,
            tipo: "admin",
            nome: "João"
        });

        expect(Auth.getName()).toBe("João");
    });

    it("deve retornar null para dados ausentes", () => {
        Auth.save({});

        expect(Auth.getId()).toBeNull();
        expect(Auth.getType()).toBeNull();
        expect(Auth.getName()).toBeNull();
    });
});
