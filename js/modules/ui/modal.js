function bindModalBackdropClose(modal) {
  if (!modal || modal.dataset.backdropBound === "1") return;

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.add("hidden");
      document.body.classList.remove("modal-open");
    }
  });

  modal.dataset.backdropBound = "1";
}

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  bindModalBackdropClose(modal);

  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.add("hidden");

  if (!document.querySelector(".modal:not(.hidden)")) {
    document.body.classList.remove("modal-open");
  }
}