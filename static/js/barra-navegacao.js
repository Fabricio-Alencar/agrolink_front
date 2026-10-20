
(() => {
  const currentScript = document.currentScript;

  const scriptUrl = currentScript?.src
    ? new URL(currentScript.src, document.baseURI)
    : new URL("../js/barra-navegacao.js", document.baseURI);

  // Localização do HTML parcial
  const templateUrl = new URL(
    "../components/barra-navegacao.html",
    scriptUrl
  );

  class BarraNavegacao extends HTMLElement {
    static get observedAttributes() {
      return [
        "pagina",
        "url-produtos",
        "url-pedidos",
        "url-chat",
        "url-inicio"
      ];
    }

    connectedCallback() {
      if (
        this.dataset.carregando === "true" ||
        this.dataset.pronto === "true"
      ) {
        return;
      }

      this.dataset.carregando = "true";
      this.setAttribute("aria-busy", "true");

      this.carregarTemplate();
    }

    attributeChangedCallback() {
      if (this.dataset.pronto === "true") {
        this.configurarNavegacao();
      }
    }

    async carregarTemplate() {
      try {
        const resposta = await fetch(templateUrl);

        if (!resposta.ok) {
          throw new Error(
            `Não foi possível carregar o HTML (${resposta.status}).`
          );
        }

        this.innerHTML = await resposta.text();

        this.dataset.pronto = "true";
        this.dataset.carregando = "false";

        this.removeAttribute("aria-busy");

        this.configurarNavegacao();
        this.atualizarIcones();

      } catch (erro) {
        this.dataset.carregando = "false";
        this.removeAttribute("aria-busy");

        console.error("[barra-navegacao]", erro);
      }
    }

    configurarNavegacao() {
      const links = {
        produtos:
          this.getAttribute("url-produtos") ||
          "produtos_produtor.html",

        pedidos:
          this.getAttribute("url-pedidos") ||
          "pedidos.html",

        chat:
          this.getAttribute("url-chat") ||
          "chat.html",

        inicio:
          this.getAttribute("url-inicio") ||
          "index.html"
      };

      const pagina = (
        this.getAttribute("pagina") || ""
      ).toLowerCase();

      const tipoUsuario = window.Auth
        ?.getType()
        ?.toLowerCase()
        ?.trim();

      // Link de produtos / marketplace
      const linkProdutos = this.querySelector(
        '[data-link="produtos"]'
      );

      if (linkProdutos) {
        const texto = linkProdutos.querySelector("span");

        if (tipoUsuario === "estabelecimento") {
          // Estabelecimento: Marketplace
          if (texto) {
            texto.textContent = "Marketplace";
          }

          linkProdutos.setAttribute(
            "href",
            links.produtos === "produtos_produtor.html"
              ? "marketplace_estabelecimento.html"
              : links.produtos
          );

          linkProdutos.dataset.page = "marketplace";

        } else if (tipoUsuario === "produtor") {
          // Produtor: Meus produtos
          if (texto) {
            texto.textContent = "Meus produtos";
          }

          linkProdutos.setAttribute(
            "href",
            links.produtos
          );

          linkProdutos.dataset.page = "produtos";
        } else {
          console.warn(
            "[barra-navegacao] Tipo de usuário não identificado:",
            tipoUsuario
          );
        }
      }

      // Configura os outros links
      this.querySelectorAll("[data-link]").forEach(link => {
        const chave = link.dataset.link;

        if (chave !== "produtos" && links[chave]) {
          link.setAttribute("href", links[chave]);
        }
      });

      // Destaca a página atual
      this.querySelectorAll("[data-page]").forEach(link => {
        const ativo = link.dataset.page === pagina;

        link.classList.toggle("is-active", ativo);

        if (ativo) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      this.atualizarIcones();
    }

    atualizarIcones() {
      if (window.lucide?.createIcons) {
        window.lucide.createIcons();
      }
    }
  }

  if (!customElements.get("barra-navegacao")) {
    customElements.define("barra-navegacao", BarraNavegacao);
  }
})();
