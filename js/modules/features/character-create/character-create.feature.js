import { createCharacter } from '../../services/character.service.js';
import { getLocalPlayerId } from '../../auth/player-auth.js';
import { showToast } from '../../toast.js';
import { openModal, closeModal } from '../../ui/modal.js';

let currentCropper = null;
let currentCroppedAvatarBlob = null;

function $(id) {
  return document.getElementById(id);
}

function resetCreateCharacterForm() {
  if (!$("characterName")) return;

  $("characterName").value = "";
  $("characterRace").value = "";
  $("characterClass").value = "";
  $("characterTrackFile").value = "";
  $("characterDescription").value = "";
  $("characterAvatarFile").value = "";
  $("characterAvatarPreview").innerHTML = "Изображение ещё не выбрано";
  $("characterAvatarPreview").classList.add("empty");

  currentCroppedAvatarBlob = null;
}

function openCharacterModalForCreate() {
  resetCreateCharacterForm();
  openModal("characterModal");
}

async function saveCharacterHandler(onCreated) {
  const playerId = getLocalPlayerId();

  if (!playerId) {
    showToast("Игрок не найден", "error");
    return;
  }

  const name = $("characterName")?.value.trim();
  const race = $("characterRace")?.value.trim();
  const className = $("characterClass")?.value.trim();
  const description = $("characterDescription")?.value.trim();
  const trackFile = $("characterTrackFile")?.files[0] || null;

  if (!name) {
    showToast("Введите имя персонажа", "error");
    return;
  }

  try {
    await createCharacter(
      playerId,
      { name, race, className, description },
      currentCroppedAvatarBlob,
      trackFile
    );

    showToast("Персонаж создан", "success");
    closeModal("characterModal");

    if (onCreated) {
      await onCreated();
    }
  } catch (error) {
    showToast("Ошибка создания: " + error.message, "error");
  }
}

function openCropModal(imageSrc) {
  if (!$("cropImage") || !$("cropModal")) return;

  $("cropImage").src = imageSrc;
  openModal("cropModal");

  if (currentCropper) {
    currentCropper.destroy();
  }

  currentCropper = new Cropper($("cropImage"), {
    aspectRatio: 1,
    viewMode: 1,
    dragMode: "move",
    autoCropArea: 1,
    responsive: true,
    background: false
  });
}

async function applyCrop() {
  if (!currentCropper) return;

  const canvas = currentCropper.getCroppedCanvas({ width: 700, height: 700 });

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

  currentCroppedAvatarBlob = blob;
  $("characterAvatarPreview").innerHTML = `
    <img src="${URL.createObjectURL(blob)}" class="preview-square" alt="preview" />
  `;
  $("characterAvatarPreview").classList.remove("empty");
  closeModal("cropModal");
}

function closeCropModal() {
  if (currentCropper) {
    currentCropper.destroy();
    currentCropper = null;
  }

  closeModal("cropModal");
}

export function initCharacterCreateFeature({ onCreated }) {
  $("openCharacterModalBtn")?.addEventListener("click", openCharacterModalForCreate);
  $("closeCharacterModalBtn")?.addEventListener("click", () => closeModal("characterModal"));

  $("saveCharacterBtn")?.addEventListener("click", async () => {
    await saveCharacterHandler(onCreated);
  });

  $("characterAvatarFile")?.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Выбери изображение", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => openCropModal(e.target.result);
    reader.readAsDataURL(file);
  });

  $("closeCropModalBtn")?.addEventListener("click", closeCropModal);
  $("applyCropBtn")?.addEventListener("click", applyCrop);
}