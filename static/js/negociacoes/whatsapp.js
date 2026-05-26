/**
 * ARQUIVO: whatsapp.js
 * OBJETIVO: Monitorar a tela de detalhes, extrair os dados reais do cache/API e injetar o botão
 */

import { getCacheNegociacoes } from "./renderizacao.js";

(function () {
    // Função principal que valida os dados e injeta o botão
    async function injetarBotaoWhatsApp() {
        const detailsContainer = document.getElementById('details-content');
        if (!detailsContainer) return;

        // Evita duplicar o botão se ele já existir na tela
        if (detailsContainer.querySelector('.btn-whatsapp')) return;

        // Procura por elementos que indiquem que os detalhes já foram renderizados
        const negocianteElement = detailsContainer.querySelector('.col-right .info-value');
        const produtoElement = detailsContainer.querySelector('.col-left .info-value');
        if (!negocianteElement || !produtoElement) return; 

        // 🔍 ESTRATÉGIA PARA PEGAR O TELEFONE REAL:
        // Buscamos o ID do pedido que está ativo no cache do sistema
        const nomeProduto = produtoElement.textContent.trim();
        const nomeNegociante = negocianteElement.textContent.trim();
        
        const cache = getCacheNegociacoes() || [];
        
        // Encontra o pedido atual comparando o nome do produto e do negociante que estão na tela
        const pedidoAtual = cache.find(o => 
            o.produto_nome === nomeProduto && 
            o.negociante_nome === nomeNegociante
        );

        // Se não achar no cache ou o pedido não tiver telefone cadastrado, encerra
        if (!pedidoAtual || (!pedidoAtual.negociante_telefone && !pedidoAtual.telefone)) {
            console.warn("Telefone do negociante não encontrado no cache de negociações.");
            return;
        }

        // Obtém o número dinâmico do banco de dados vindo do objeto do cache
        const telefoneReal = pedidoAtual.negociante_telefone || pedidoAtual.telefone;

        // Limpa e formata o número para o padrão do link do WhatsApp
        const telefoneLimpo = telefoneReal.replace(/\D/g, '');
        const prefixo = telefoneLimpo.startsWith('55') ? '' : '55';
        const mensagem = encodeURIComponent(`Olá ${nomeNegociante}! Gostaria de alinhar alguns detalhes sobre a negociação de ${nomeProduto}.`);
        const linkWhatsApp = `https://wa.me/${prefixo}${telefoneLimpo}?text=${mensagem}`;

        // Cria o elemento do botão
        const btnWpp = document.createElement('a');
        btnWpp.href = linkWhatsApp;
        btnWpp.target = '_blank';
        btnWpp.rel = 'noopener noreferrer';
        btnWpp.className = 'btn-whatsapp';
        btnWpp.style.display = 'inline-flex';
        btnWpp.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contatar via WhatsApp
        `;

        // Localiza a coluna da direita criada pelo outro script e joga o botão lá dentro
        const colunaDireita = detailsContainer.querySelector('.col-right');
        if (colunaDireita) {
            colunaDireita.appendChild(btnWpp);
        }
    }

    // CONFIGURAÇÃO DO OBSERVER (O "Vigia" do HTML)
    const targetNode = document.getElementById('details-content');
    if (targetNode) {
        const config = { childList: true, subtree: true };

        const callback = function (mutationsList) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    injetarBotaoWhatsApp();
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    }
})();
