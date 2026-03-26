const EVENTO_TOAST = "gaspass:toast";

function dispararToast(tipo, mensagem, duracaoMs = 3200) {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent(EVENTO_TOAST, {
      detail: { tipo, mensagem, duracaoMs }
    })
  );
}

export function toastSucesso(mensagem, duracaoMs) {
  dispararToast("sucesso", mensagem, duracaoMs);
}

export function toastErro(mensagem, duracaoMs) {
  dispararToast("erro", mensagem, duracaoMs);
}

export { EVENTO_TOAST };
