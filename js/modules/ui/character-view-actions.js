import { openModal, closeModal } from './modal.js';
import { showToast } from '../toast.js';

let inlineAvatarCropper = null;
let inlineAvatarTargetInput = null;
let inlineAvatarTargetPreview = null;

function $(id) {
  return document.getElementById(id);
}

function destroyInlineAvatarCropper() {
  if (inlineAvatarCropper) {
    inlineAvatarCropper.destroy();
    inlineAvatarCropper = null;
  }
}

function closeInlineAvatarCropModal() {
  destroyInlineAvatarCropper();
  closeModal("inlineAvatarCropModal");
}

function openInlineAvatarCropModal(imageSrc, input, preview) {
  const image = $("inlineAvatarCropImage");
  if (!image) return;

  inlineAvatarTargetInput = input;
  inlineAvatarTargetPreview = preview;

  image.src = imageSrc;
  openModal("inlineAvatarCropModal");

  destroyInlineAvatarCropper();

  inlineAvatarCropper = new Cropper(image, {
    aspectRatio: 1,
    viewMode: 1,
    dragMode: "move",
    autoCropArea: 1,
    responsive: true,
    background: false
  });
}

async function applyInlineAvatarCrop() {
  if (!inlineAvatarCropper || !inlineAvatarTargetInput || !inlineAvatarTargetPreview) {
    return;
  }

  const canvas = inlineAvatarCropper.getCroppedCanvas({
    width: 700,
    height: 700
  });

  if (!canvas) {
    showToast("Не удалось обрезать изображение", "error");
    return;
  }

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.92);
  });

  if (!blob) {
    showToast("Не удалось подготовить изображение", "error");
    return;
  }

  const file = new File(
    [blob],
    `character_avatar_${Date.now()}.jpg`,
    { type: "image/jpeg" }
  );

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  inlineAvatarTargetInput.files = dataTransfer.files;

  inlineAvatarTargetPreview.src = URL.createObjectURL(blob);

  closeInlineAvatarCropModal();
}

function bindInlineAvatarCropModal() {
  const closeBtn = $("closeInlineAvatarCropModalBtn");
  const applyBtn = $("applyInlineAvatarCropBtn");

  if (closeBtn && closeBtn.dataset.bound !== "1") {
    closeBtn.addEventListener("click", closeInlineAvatarCropModal);
    closeBtn.dataset.bound = "1";
  }

  if (applyBtn && applyBtn.dataset.bound !== "1") {
    applyBtn.addEventListener("click", applyInlineAvatarCrop);
    applyBtn.dataset.bound = "1";
  }
}

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

  bindInlineAvatarCropModal();

  function applyHeaderState() {
    if (!editBtn || !deleteBtn) return;

    if (isEditing) {
      editBtn.innerHTML = `💾 <span>Сохранить</span>`;
      editBtn.className = "character-header-save-btn";
      editBtn.setAttribute("type", "button");
      editBtn.setAttribute("title", "Сохранить");
      editBtn.setAttribute("aria-label", "Сохранить");

      deleteBtn.innerHTML = `↺`;
      deleteBtn.className = "icon-only-button";
      deleteBtn.setAttribute("type", "button");
      deleteBtn.setAttribute("title", "Отмена");
      deleteBtn.setAttribute("aria-label", "Отмена");
    } else {
      editBtn.innerHTML = `✏`;
      editBtn.className = "icon-only-button";
      editBtn.setAttribute("type", "button");
      editBtn.setAttribute("title", "Редактировать");
      editBtn.setAttribute("aria-label", "Редактировать");

      deleteBtn.innerHTML = `🗑`;
      deleteBtn.className = "icon-only-button danger-icon-button";
      deleteBtn.setAttribute("type", "button");
      deleteBtn.setAttribute("title", "Удалить");
      deleteBtn.setAttribute("aria-label", "Удалить");
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
        closeInlineAvatarCropModal();
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

  if (avatarInput && avatarPreview && avatarInput.dataset.bound !== "1") {
    avatarInput.addEventListener("change", () => {
      const file = avatarInput.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showToast("Выбери изображение", "error");
        avatarInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        openInlineAvatarCropModal(event.target?.result || "", avatarInput, avatarPreview);
      };
      reader.readAsDataURL(file);
    });

    avatarInput.dataset.bound = "1";
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