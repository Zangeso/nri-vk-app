export function bindCharacterViewActions({
  characterId,
  originalTrackUrl = null,
  originalAvatarUrl = null,
  onSave,
  onDelete,
  onOpenAchievement,
  onInitSlider
}) {
  const editBtn = document.getElementById("openInlineEditBtn");
  const deleteBtn = document.getElementById("openInlineDeleteBtn");

  const sheet = document.getElementById("characterInlineSheet");

  const avatarInput = document.getElementById("inlineCharacterAvatarFile");
  const avatarPreview = document.getElementById("inlineCharacterAvatarPreview");
  const avatarPickBtn = document.getElementById("inlineCharacterAvatarPickBtn");

  const trackInput = document.getElementById("inlineCharacterTrackFile");

  let isEditing = false;

  function applyHeaderState() {
    if (!editBtn || !deleteBtn) return;

    if (isEditing) {
      editBtn.innerHTML = `💾 <span>Сохранить изменения</span>`;
      editBtn.classList.add("character-header-save-btn");
      editBtn.setAttribute("title", "Сохранить изменения");
      editBtn.setAttribute("aria-label", "Сохранить изменения");

      deleteBtn.innerHTML = `↺`;
      deleteBtn.setAttribute("title", "Отмена");
      deleteBtn.setAttribute("aria-label", "Отмена");
      deleteBtn.classList.remove("danger-icon-button");
    } else {
      editBtn.innerHTML = `✏`;
      editBtn.classList.remove("character-header-save-btn");
      editBtn.setAttribute("title", "Редактировать");
      editBtn.setAttribute("aria-label", "Редактировать");

      deleteBtn.innerHTML = `🗑`;
      deleteBtn.setAttribute("title", "Удалить");
      deleteBtn.setAttribute("aria-label", "Удалить");
      deleteBtn.classList.add("danger-icon-button");
    }
  }

  function resetInlineFiles() {
    if (avatarInput) {
      avatarInput.value = "";
    }

    if (trackInput) {
      trackInput.value = "";
    }
  }

  function resetAvatarPreview() {
    if (!avatarPreview) return;
    avatarPreview.src = originalAvatarUrl || avatarPreview.dataset.fallback || avatarPreview.src;
  }

  function setEditing(next) {
    isEditing = Boolean(next);

    if (sheet) {
      sheet.classList.toggle("is-editing", isEditing);
    }

    applyHeaderState();
  }

  if (avatarPreview && !avatarPreview.dataset.fallback) {
    avatarPreview.dataset.fallback = avatarPreview.src || "";
  }

  if (editBtn) {
    editBtn.addEventListener("click", async () => {
      if (!isEditing) {
        setEditing(true);
        return;
      }

      if (onSave) {
        await onSave(characterId, originalTrackUrl, originalAvatarUrl);
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      if (isEditing) {
        resetInlineFiles();
        resetAvatarPreview();
        setEditing(false);
        return;
      }

      if (onDelete) {
        onDelete(characterId);
      }
    });
  }

  if (avatarPickBtn && avatarInput) {
    avatarPickBtn.addEventListener("click", () => {
      if (!isEditing) return;
      avatarInput.click();
    });
  }

  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener("change", () => {
      const file = avatarInput.files?.[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      avatarPreview.src = url;
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

  applyHeaderState();
}