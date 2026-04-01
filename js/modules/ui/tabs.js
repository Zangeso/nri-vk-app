export function initMainTabs() {
  const buttons = document.querySelectorAll(".main-tab-button");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".main-tab-button").forEach((btn) => {
        btn.classList.remove("active");
      });

      document.querySelectorAll(".main-tab-panel").forEach((panel) => {
        panel.classList.remove("active");
      });

      button.classList.add("active");

      const panelId = button.getAttribute("data-main-tab");
      const panel = document.getElementById(panelId);

      if (panel) {
        panel.classList.add("active");
      }
    });
  });
}