export function openModal(modalId) {
const modal = document.getElementById(modalId);
if (!modal) return;

modal.classList.remove("hidden");
}

export function closeModal(modalId) {
const modal = document.getElementById(modalId);
if (!modal) return;

modal.classList.add("hidden");
}
