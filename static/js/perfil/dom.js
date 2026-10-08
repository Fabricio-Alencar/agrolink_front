// =============================================================
// ELEMENTOS DO DOM - PERFIL
// =============================================================
export const DOM = {
    // DADOS PRINCIPAIS
    userName: document.querySelector(".user-name"),
    userRole: document.querySelector(".user-role"),

    // FOTO DE PERFIL
    profileImg: document.getElementById("profile-img"),
    uploadZone: document.getElementById("profile-upload-zone"),
    fileInput: document.getElementById("file-input"),

    // FORMULÁRIO E EDIÇÃO
    inputs: document.querySelectorAll(".form-control"),
    editIcons: document.querySelectorAll(".edit-icon"),
    allEditable: document.querySelectorAll(".form-control"),

    // LOCALIZAÇÃO
    city: document.getElementById("profile-city"),
    state: document.getElementById("profile-state"),

    // EXCLUSÃO DE CONTA
    btnDeleteAcc: document.getElementById("btn-delete-account"),
    modalDelete: document.getElementById("delete-modal"),
    btnCancelDelete: document.getElementById("btn-cancel-delete"),
    btnConfirmDelete: document.getElementById("btn-confirm-delete")
};