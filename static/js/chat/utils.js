
/* =========================================================
   CONVERSÃO E VALIDAÇÃO DE DATA
========================================================= */

/**
 * Converte uma data em um objeto Date válido.
 *
 * Datas sem indicação de fuso horário são consideradas UTC.
 * Datas que já possuem fuso horário mantêm essa informação.
 *
 * @param {string|Date} data - Data recebida do backend.
 * @returns {Date|null} Data convertida ou null se for inválida.
 */
export function obterDataValida(data) {
    if (!data) {
        return null;
    }

    if (data instanceof Date) {
        return Number.isNaN(data.getTime()) ? null : data;
    }

    const dataTexto = String(data).trim();

    const temFusoHorario =
        /(?:Z|[+-]\d{2}:?\d{2})$/i.test(dataTexto);

    let dataNormalizada = dataTexto.replace(" ", "T");

    dataNormalizada = dataNormalizada.replace(
        /(\.\d{3})\d+$/,
        "$1"
    );

    if (!temFusoHorario) {
        dataNormalizada += "Z";
    }

    const dataConvertida = new Date(dataNormalizada);

    if (Number.isNaN(dataConvertida.getTime())) {
        console.warn("Data inválida recebida:", data);
        return null;
    }

    return dataConvertida;
}


/* =========================================================
   OBTÉM A DATA DA ÚLTIMA MENSAGEM
========================================================= */

/**
 * Obtém a data da última mensagem de uma conversa.
 *
 * Aceita os formatos utilizados pela API e pelos eventos do chat:
 * - data_envio
 * - data_ultima_mensagem
 * - ultima_mensagem.data_envio
 *
 * @param {Object} conversa - Conversa ou mensagem.
 * @returns {string|Date|null} Data encontrada ou null.
 */
export function obterDataUltimaMensagem(conversa) {
    // Prioriza a data da mensagem atual, quando disponível.
    if (conversa?.data_envio) {
        return conversa.data_envio;
    }

    // Utiliza a data da última mensagem retornada pela API.
    if (conversa?.data_ultima_mensagem) {
        return conversa.data_ultima_mensagem;
    }

    // Tenta obter a data dentro do objeto da última mensagem.
    const ultimaMensagem = conversa?.ultima_mensagem;

    if (
        ultimaMensagem &&
        typeof ultimaMensagem === "object"
    ) {
        return ultimaMensagem.data_envio || null;
    }

    return null;
}


/* =========================================================
   VERIFICA SE A CONVERSA ESTÁ ARQUIVADA
========================================================= */

/**
 * Verifica se uma conversa está arquivada.
 *
 * Aceita os valores booleanos true e a string "true",
 * independentemente de espaços ou letras maiúsculas.
 *
 * @param {Object} conversa - Dados da conversa.
 * @returns {boolean} Indica se a conversa está arquivada.
 */
export function conversaEstaArquivada(conversa) {
    return conversa?.arquivada === true ||
        String(conversa?.arquivada)
            .trim()
            .toLowerCase() === "true";
}


/* =========================================================
   FORMATAÇÃO DE HORA
========================================================= */

/**
 * Formata uma data para exibir somente horas e minutos.
 *
 * Exemplo: "14:35".
 *
 * @param {string|Date} dataEnvio - Data a ser formatada.
 * @returns {string} Horário formatado ou string vazia.
 */
export function formatarHora(dataEnvio) {
    const data = obterDataValida(dataEnvio);

    if (!data) {
        return "";
    }

    return data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}


/* =========================================================
   FORMATAÇÃO DA DATA DA MENSAGEM
========================================================= */

/**
 * Formata a data conforme o dia em que a mensagem foi enviada.
 *
 * - Hoje: exibe o horário, por exemplo, "14:35".
 * - Ontem: exibe "Ontem".
 * - Dias anteriores: exibe a data, por exemplo, "09/10/2026".
 *
 * @param {string|Date} data - Data da mensagem.
 * @returns {string} Data formatada ou string vazia.
 */
export function formatarHorarioMensagem(data) {
    const dataConvertida = obterDataValida(data);

    if (!dataConvertida) {
        return "";
    }

    const agora = new Date();

    const hoje = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
    );

    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    const dataMensagem = new Date(
        dataConvertida.getFullYear(),
        dataConvertida.getMonth(),
        dataConvertida.getDate()
    );

    if (dataMensagem.getTime() === hoje.getTime()) {
        return formatarHora(dataConvertida);
    }

    if (dataMensagem.getTime() === ontem.getTime()) {
        return "Ontem";
    }

    return dataConvertida.toLocaleDateString("pt-BR");
}


/* =========================================================
   HORÁRIO ATUAL
========================================================= */

/**
 * Retorna o horário atual do dispositivo.
 *
 * @returns {string} Horário atual no formato HH:MM.
 */
export function obterHoraAtual() {
    return formatarHora(new Date());
}
