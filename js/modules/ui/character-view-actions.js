export function bindCharacterViewActions({
  characterId,
  originalTrackUrl = null,
  onSave,
  onDelete,
  onOpenAchievement,
  onInitSlider
}) {
  const editBtn = document.getElementById("openInlineEditBtn");
  const cancelBtn = document.getElementById("cancelInlineEditBtn");
  const saveBtn = document.getElementById("saveInlineEditBtn");
  const deleteBtn = document.getElementById("openInlineDeleteBtn");
  const editBlock = document.getElementById("characterInlineEditBlock");

  if (editBtn && editBlock) {
    editBtn.addEventListener("click", () => {
      editBlock.classList.remove("hidden");
    });
  }

  if (cancelBtn && editBlock) {
    cancelBtn.addEventListener("click", () => {
      editBlock.classList.add("hidden");
    });
  }

  if (saveBtn && onSave) {
    saveBtn.addEventListener("click", async () => {
      await onSave(characterId, originalTrackUrl);
    });
  }

  if (deleteBtn && onDelete) {
    deleteBtn.addEventListener("click", () => {
      onDelete(characterId);
    });
  }

  document.querySelectorAll(".character-achievement-orb-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!onOpenAchievement) return;

      onOpenAchievement({
        image: decodeURIComponent(button.dataset.image || ""),
        title: decodeURIComponent(button.dataset.title || ""),
        character: decodeURIComponent(button.dataset.character || ""),
        player: decodeURIComponent(button.dataset.player || ""),
        description: decodeURIComponent(button.dataset.description || "")
      });
    });
  });

  if (onInitSlider) {
    onInitSlider();
  }
}