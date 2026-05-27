import { 
    carregarDadosIniciais, 
    configurarEdicaoESalvamento, 
    configurarUploadFoto, 
    configurarModalExclusao 
} from './eventos.js';

document.addEventListener("DOMContentLoaded", () => {
    carregarDadosIniciais();
    configurarEdicaoESalvamento();
    configurarUploadFoto();
    configurarModalExclusao();
});