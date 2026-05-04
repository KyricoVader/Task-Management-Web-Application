const DEFAULT_DURATION = 4000;

export class NotificationCenter {
  constructor(container) {
    this.container = container;
  }

  show(message, duration = DEFAULT_DURATION) {
    const node = document.createElement("div");
    node.className = "notification";
    node.innerHTML = `
      <span class="notification-text"></span>
      <button class="notification-close" aria-label="Close">×</button>
    `;
    node.querySelector(".notification-text").textContent = message;

    const dismiss = () => this.dismiss(node);
    node.querySelector(".notification-close").addEventListener("click", dismiss);

    this.container.appendChild(node);

    const timeoutId = setTimeout(dismiss, duration);
    node.dataset.timeoutId = String(timeoutId);
  }

  dismiss(node) {
    if (!node.isConnected || node.classList.contains("is-leaving")) return;
    if (node.dataset.timeoutId) clearTimeout(Number(node.dataset.timeoutId));
    node.classList.add("is-leaving");
    node.addEventListener("animationend", () => node.remove(), { once: true });
  }
}
