document.addEventListener("DOMContentLoaded", function() {
    const btnCeagesp = document.getElementById('btnCeagesp');
    const dropdownCeagesp = document.getElementById('dropdownCeagesp');
    const inputNomeProduto = document.getElementById('nomeProduto');
    const inputCategoriaProduto = document.getElementById('categoriaProduto'); 

    // URL base da API no Azure
    const API_URL = 'https://cotacoes-heamdfd4byhpehf6.eastus2-01.azurewebsites.net/api/cotacoes-ceagesp';

    // Função que realiza a busca real no backend no Azure
    async function abrirDropdownCeagesp() {
        const nomeDigitado = inputNomeProduto ? inputNomeProduto.value.trim().toLowerCase() : '';
        const categoriaDigitada = inputCategoriaProduto ? inputCategoriaProduto.value.trim().toLowerCase() : '';
        
        dropdownCeagesp.innerHTML = ''; 

        if (!nomeDigitado) {
            renderizarAviso("Digite um produto primeiro", "Você precisa digitar o nome do produto no campo acima para buscar sugestões.");
            mostrarDropdown();
            return;
        }

        // Estado visual de carregamento
        dropdownCeagesp.innerHTML = `
            <div class="ceagesp-aviso">
                <strong>Buscando cotações...</strong>
                <p>Consultando cotações da CEAGESP em tempo real.</p>
            </div>
        `;
        mostrarDropdown();

        try {
            // Monta os parâmetros de consulta (Query String)
            let params = new URLSearchParams({ produto: nomeDigitado });
            if (categoriaDigitada) {
                params.append('categoria', categoriaDigitada);
            }

            // Faz a requisição GET para a API na Azure
            const response = await fetch(`${API_URL}?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Erro na requisição: Status ${response.status}`);
            }

            const dadosProduto = await response.json();

            // Verifica se a API retornou cotações válidas
            if (!dadosProduto || (Array.isArray(dadosProduto) && dadosProduto.length === 0)) {
                renderizarAviso("Cotação não encontrada", "Não encontramos cotações ativas para este produto na CEAGESP.");
            } else {
                // Renderiza os dados retornados pela API
                renderizarLista(nomeDigitado, Array.isArray(dadosProduto) ? dadosProduto : [dadosProduto]);
            }

        } catch (erro) {
            console.error("Erro ao buscar cotações da CEAGESP:", erro);
            renderizarAviso("Serviço indisponível", "Não foi possível conectar ao servidor da CEAGESP. Tente novamente mais tarde.");
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    function renderizarLista(nomeDigitado, dados) {
        const nomeFormatado = nomeDigitado.charAt(0).toUpperCase() + nomeDigitado.slice(1);
        
        let htmlLista = `
            <div class="ceagesp-header">
                <h3>${nomeFormatado}</h3>
                <p>Selecione uma classificação</p>
            </div>
            <div class="ceagesp-container-scroll">
                <div class="ceagesp-lista" id="ceagespLista">
        `;

        dados.forEach(item => {
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
                // Checa se a altura total do conteúdo ultrapassa a altura visível do container
                const temScroll = listaEl.scrollHeight > listaEl.clientHeight;
                // Checa se o usuário rolou até o final da lista (tolerância de 3px)
                const chegouNoFim = Math.ceil(listaEl.scrollTop + listaEl.clientHeight) >= listaEl.scrollHeight - 3;

                if (temScroll && !chegouNoFim) {
                    hintEl.classList.remove('oculto');
                } else {
                    hintEl.classList.add('oculto');
                }
            }

            // Executa após a renderização dos elementos no DOM e ao rolar a lista
            setTimeout(checarScroll, 100);
            listaEl.addEventListener('scroll', checarScroll);
        }
    }

    function renderizarAviso(titulo, mensagem) {
        dropdownCeagesp.innerHTML = `
            <div class="ceagesp-aviso">
                <strong>${titulo}</strong>
                <p>${mensagem}</p>
            </div>
        `;
    }

    function mostrarDropdown() {
        dropdownCeagesp.classList.remove('oculto');
    }

    if (btnCeagesp) {
        btnCeagesp.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (dropdownCeagesp.classList.contains('oculto')) {
                abrirDropdownCeagesp();
            } else {
                dropdownCeagesp.classList.add('oculto');
            }
        });
    }

    document.addEventListener('click', function(e) {
        if (btnCeagesp && !btnCeagesp.contains(e.target) && dropdownCeagesp && !dropdownCeagesp.contains(e.target)) {
            dropdownCeagesp.classList.add('oculto');
        }
    });
});

window.selecionarPrecoCeagesp = function(valor) {
    const inputPrecoProduto = document.getElementById('precoProduto');
    const dropdownCeagesp = document.getElementById('dropdownCeagesp');
    
    if (inputPrecoProduto) {
        inputPrecoProduto.value = Number(valor).toFixed(2);
    }
    if (dropdownCeagesp) {
        dropdownCeagesp.classList.add('oculto');
    }
};