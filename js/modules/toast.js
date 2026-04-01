export function showToast(message, type = "info", duration = 3000) {
if (!message) return;

const toast = document.createElement("div");
toast.className = `toast toast-${type}`;
toast.textContent = String(message);

document.body.appendChild(toast);

window.setTimeout(() => {
toast.remove();
}, duration);
}
