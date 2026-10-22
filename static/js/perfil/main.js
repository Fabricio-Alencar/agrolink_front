
import {
    carregarDadosIniciais,
    configurarEdicaoESalvamento
} from './perfil-controller.js';

import { configurarLocalizacao } from './localizacao.js';

import {
    inicializarCamposSenha
} from './senha.js';

import { configurarModalExclusao } from './modal-exclusao.js';

document.addEventListener("DOMContentLoaded", () => {
    // Inicializa os campos de senha com os olhos ocultos.
    inicializarCamposSenha();

    // Carrega os dados do perfil.
    carregarDadosIniciais();

    // Configura a edição e o salvamento do perfil.
    configurarEdicaoESalvamento();

    // Configura a localização.
    configurarLocalizacao();

    // Configura o modal de exclusão da conta.
    configurarModalExclusao();
});
