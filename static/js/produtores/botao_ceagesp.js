document.addEventListener("DOMContentLoaded", function() {
    console.log("🚀 [CEAGESP] Script inicializado e DOM carregado.");

    const btnCeagesp = document.getElementById('btnCeagesp');
    const dropdownCeagesp = document.getElementById('dropdownCeagesp');
    const inputNomeProduto = document.getElementById('nomeProduto');
    const inputCategoriaProduto = document.getElementById('categoriaProduto'); 

    // Validação de presença dos elementos na página
    console.log("🔍 [CEAGESP] Elementos encontrados no DOM:", {
        btnCeagesp: !!btnCeagesp,
        dropdownCeagesp: !!dropdownCeagesp,
        inputNomeProduto: !!inputNomeProduto,
        inputCategoriaProduto: !!inputCategoriaProduto
    });

    // URL base da API no Azure
    const API_URL = 'https://cotacoes-heamdfd4byhpehf6.eastus2-01.azurewebsites.net/cotacoes';

    // Função que realiza a busca real no backend no Azure
    async function abrirDropdownCeagesp() {
        console.group("📡 [CEAGESP] Iniciando abertura do dropdown e busca");
        
        const nomeDigitado = inputNomeProduto ? inputNomeProduto.value.trim().toLowerCase() : '';
        const categoriaDigitada = inputCategoriaProduto ? inputCategoriaProduto.value.trim().toLowerCase() : '';
        
        console.log("📝 Inputs capturados:", { 
            nomeDigitado, 
            categoriaDigitada 
        });

        mostrarDropdown(); 

        if (!nomeDigitado) {
            console.warn("⚠️ [CEAGESP] Busca cancelada: Campo de nome do produto está vazio.");
            renderizarAviso("Digite um produto primeiro", "Você precisa digitar o nome do produto no campo acima para buscar sugestões.");
            console.groupEnd();
            return;
        }

        // Estado visual de carregamento
        dropdownCeagesp.innerHTML = `
            <div class="ceagesp-aviso">
                <strong>Buscando cotações...</strong>
                <p>Consultando cotações da CEAGESP em tempo real.</p>
            </div>
        `;

        const inicioTempo = performance.now();

        try {
            // Monta os parâmetros de consulta (Query String)
            const params = new URLSearchParams({ produto: nomeDigitado });
            if (categoriaDigitada) {
                params.append('categoria', categoriaDigitada);
            }

            const urlFinal = `${API_URL}?${params.toString()}`;
            console.log("🌐 URL final da requisição:", urlFinal);
            console.log("⏳ Disparando fetch para a API no Azure...");

            // Faz a requisição GET para a API na Azure
            const response = await fetch(urlFinal);
            const fimTempo = performance.now();
            
            console.log(`⏱️ Resposta da rede recebida em ${(fimTempo - inicioTempo).toFixed(2)}ms`);
            console.log("📊 Response HTTP Details:", {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                redirected: response.redirected,
                type: response.type,
                url: response.url,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (!response.ok) {
                throw new Error(`Erro na requisição: Status ${response.status} (${response.statusText})`);
            }

            console.log("📦 Convertendo resposta para JSON...");
            const dadosProduto = await response.json();
            console.log("✅ Payload JSON recebido:", dadosProduto);

            // Verifica se a API retornou cotações válidas
            if (!dadosProduto || (Array.isArray(dadosProduto) && dadosProduto.length === 0)) {
                console.warn("⚠️ [CEAGESP] API retornou sucesso, mas com lista/objeto de produtos vazios.");
                renderizarAviso("Cotação não encontrada", "Não encontramos cotações ativas para este produto na CEAGESP.");
            } else {
                console.log("🎨 Renderizando lista de produtos recebida...");
                renderizarLista(nomeDigitado, Array.isArray(dadosProduto) ? dadosProduto : [dadosProduto]);
            }

        } catch (erro) {
            const fimTempoErro = performance.now();
            console.group("❌ [CEAGESP] ERRO CRÍTICO NA REQUISIÇÃO");
            console.error(`Tempo transcorrido até o erro: ${(fimTempoErro - inicioTempo).toFixed(2)}ms`);
            console.error("Tipo do erro (Name):", erro.name);
            console.error("Mensagem do erro:", erro.message);
            console.error("Detalhes do erro:", erro);
            console.groupEnd();

            renderizarAviso("Serviço indisponível", "Não foi possível conectar ao servidor da CEAGESP. Tente novamente mais tarde.");
        }

        if (window.lucide) {
            console.log("🔄 Recarregando ícones Lucide...");
            lucide.createIcons();
        }

        console.groupEnd();
    }

    function renderizarLista(nomeDigitado, dados) {
        console.log(`📋 [CEAGESP] Renderizando ${dados.length} item(ns) na lista.`);
        const nomeFormatado = nomeDigitado.charAt(0).toUpperCase() + nomeDigitado.slice(1);
        
        let htmlLista = `
            <div class="ceagesp-header">
                <h3>${nomeFormatado}</h3>
                <p>Selecione uma classificação</p>
            </div>
            <div class="ceagesp-container-scroll">
                <div class="ceagesp-lista" id="ceagespLista">
        `;

        dados.forEach((item, index) => {
            const temClassificacaoValida = item.classificacao && item.classificacao.trim() !== "-";
            const textoExibicao = temClassificacaoValida 
                ? `${item.produto} - ${item.classificacao}` 
                : item.produto;

            const precoNum = Number(item.preco_comum) || 0;
            const unidade = item.unidade_peso ? item.unidade_peso.toLowerCase() : 'kg';

            htmlLista += `
                <div class="ceagesp-item" onclick="selecionarPrecoCeagesp(${precoNum})">
                    <span class="ceagesp-classificacao">${textoExibicao}</span>
                    <span class="ceagesp-preco">R$ ${precoNum.toFixed(2).replace('.', ',')}/${unidade}</span>
                </div>
            `;
        });

        htmlLista += `
                </div>
                <div class="ceagesp-scroll-hint oculto" id="ceagespScrollHint">
                    Role para ver mais <i data-lucide="chevron-down"></i>
                </div>
            </div>
            <div class="ceagesp-footer">
                <i data-lucide="bar-chart-2"></i> 
                Preço sugerido com base na CEAGESP-SP
            </div>
        `;

        dropdownCeagesp.innerHTML = htmlLista;

        // Lógica de cálculo da barra de rolagem
        const listaEl = document.getElementById('ceagespLista');
        const hintEl = document.getElementById('ceagespScrollHint');

        if (listaEl && hintEl) {
            function checarScroll() {
                const temScroll = listaEl.scrollHeight > listaEl.clientHeight;
                const chegouNoFim = Math.ceil(listaEl.scrollTop + listaEl.clientHeight) >= listaEl.scrollHeight - 3;

                if (temScroll && !chegouNoFim) {
                    hintEl.classList.remove('oculto');
                } else {
                    hintEl.classList.add('oculto');
                }
            }

            setTimeout(checarScroll, 100);
            listaEl.addEventListener('scroll', checarScroll);
        }
    }

    function renderizarAviso(titulo, mensagem) {
        console.log(`ℹ️ [CEAGESP] Exibindo aviso visual: "${titulo}"`);
        dropdownCeagesp.innerHTML = `
            <div class="ceagesp-aviso">
                <strong>${titulo}</strong>
                <p>${mensagem}</p>
            </div>
        `;
    }

    function mostrarDropdown() {
        console.log("👁️ [CEAGESP] Removendo classe 'oculto' do dropdown.");
        dropdownCeagesp.classList.remove('oculto');
    }

    if (btnCeagesp) {
        btnCeagesp.addEventListener('click', function(e) {
            console.log("🖱️ [CEAGESP] Botão 'btnCeagesp' foi clicado.", { event: e, target: e.target });
            e.preventDefault();
            e.stopPropagation();

            const estaOculto = dropdownCeagesp.classList.contains('oculto');
            console.log(`📂 Estado atual do dropdown: ${estaOculto ? 'Oculto' : 'Visível'}`);

            if (estaOculto) {
                abrirDropdownCeagesp();
            } else {
                console.log("🙈 Ocultando dropdown manualmente via clique no botão.");
                dropdownCeagesp.classList.add('oculto');
            }
        });
    } else {
        console.error("❌ [CEAGESP] Botão 'btnCeagesp' não foi localizado na página!");
    }

    // Fecha o dropdown apenas se o clique for fora do botão E fora do dropdown
    document.addEventListener('click', function(e) {
        if (!btnCeagesp || !dropdownCeagesp) return;

        const clicouNoBotao = btnCeagesp.contains(e.target) || e.target.closest('#btnCeagesp');
        const clicouNoDropdown = dropdownCeagesp.contains(e.target) || e.target.closest('#dropdownCeagesp');

        if (!clicouNoBotao && !clicouNoDropdown) {
            if (!dropdownCeagesp.classList.contains('oculto')) {
                console.log("🖱️ [CEAGESP] Clique fora do menu detectado. Fechando dropdown.", { targetClicado: e.target });
                dropdownCeagesp.classList.add('oculto');
            }
        }
    });
});

window.selecionarPrecoCeagesp = function(valor) {
    console.log(`👇 [CEAGESP] Item selecionado com o valor: R$ ${valor}`);
    const inputPrecoProduto = document.getElementById('precoProduto');
    const dropdownCeagesp = document.getElementById('dropdownCeagesp');
    
    if (inputPrecoProduto) {
        inputPrecoProduto.value = Number(valor).toFixed(2);
        console.log("✅ Valor preenchido no input 'precoProduto'.");
    } else {
        console.error("❌ Input 'precoProduto' não encontrado no DOM.");
    }

    if (dropdownCeagesp) {
        dropdownCeagesp.classList.add('oculto');
        console.log("🙈 Dropdown ocultado após seleção.");
    }
};
