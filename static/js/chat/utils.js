/* =========================================================
   FORMATAÇÃO DE HORÁRIO
========================================================= */

export function formatarHora(dataEnvio) {

    if (!dataEnvio) {

        return "";

    }


    /*
       O backend envia a data sem indicar o fuso:

       2026-10-08 04:30:59

       Como essa data foi salva usando UTC,
       adicionamos o "Z" para informar ao JavaScript
       que ela está em UTC.

       Depois o toLocaleTimeString converte
       automaticamente para o horário local.
    */

    const data =
        new Date(
            dataEnvio.replace(" ", "T") + "Z"
        );


    return data.toLocaleTimeString(
        "pt-BR",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   HORÁRIO ATUAL
========================================================= */

export function obterHoraAtual() {

    return new Date().toLocaleTimeString(
        "pt-BR",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}