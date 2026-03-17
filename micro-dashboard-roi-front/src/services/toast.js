// Módulo de notificações não-bloqueantes.
// Cria um container fixo no canto inferior direito e empilha toasts.

function obterContainer() {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "false");
    document.body.appendChild(container);
  }
  return container;
}

const ICONES = {
  success: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>`,
  error: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  warning: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

function mostrar(mensagem, tipo = "info", duracao = 3500) {
  const container = obterContainer();

  const wrapper = document.createElement("div");
  wrapper.className = `toast-item toast-${tipo}`;
  wrapper.setAttribute("roler", "alert");
  wrapper.style.setProperty("--toast-duration", `${duracao}ms`);

  wrapper.innerHTML = `
        <div class="toast-icon">${ICONES[tipo]}</div>
        <span class="toast-msg">${mensagem}</span>
        <button class="toast-close" aria-label="Fechar">
        <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        </button>
        <div class="toast-progress"></div>
    `;

    wrapper.querySelector(".toast-close").addEventListener("click", () => remover(wrapper));
    container.appendChild(wrapper);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => wrapper.classList.add(".toast-visible"));
    });

    let timer = setTimeout(() => remover(wrapper), duracao);

    wrapper.addEventListener("mouseenter", () => {
        clearTimeout(timer);
        wrapper.querySelector(".toast-progress").style.animationPlayState = "paused";
    });
    wrapper.addEventListener("mouseleave", () => {
        wrapper.querySelector(".toast-progress").style.animationPlayState = "running";
        timer = setTimeout(() => remover(wrapper), 1500);
    });
}

function remover(wrapper) {
    if (wrapper.classList.contains("toast-saindo")) return;
    wrapper.classList.remove("toast-visible");
    wrapper.classList.add("toast-saindo");
    setTimeout(() => wrapper.remove(), 300);
}

export const Toast = {
  success: (msg, ms)  => mostrar(msg, "success", ms),
  error:   (msg, ms)  => mostrar(msg, "error",   ms ?? 5000),
  warning: (msg, ms)  => mostrar(msg, "warning", ms),
  info:    (msg, ms)  => mostrar(msg, "info",    ms),
};