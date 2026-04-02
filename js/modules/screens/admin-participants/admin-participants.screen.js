import { supabase } from '../../supabase.js';
import { showToast } from '../../toast.js';
import { openModal, closeModal } from '../../ui/modal.js';
import { escapeHtml, cleanDisplayText } from '../../utils.js';

let adminParticipants = [];
let editingParticipantIndex = null;

let achievementCropper = null;
let currentParticipantBlob = null;
let currentParticipantPreviewUrl = "";
let selectedCharacterId = null;

function $(id) {
  return document.getElementById(id);
}

function renderParticipantAchievementPreview(previewUrl = "") {
  if (!$("participantAchievementImagePreview")) return;

  if (previewUrl) {
    $("participantAchievementImagePreview").innerHTML =
      `<img src="${previewUrl}" class="preview-square preview-small-square" alt="preview" />`;
    $("participantAchievementImagePreview").classList.remove("empty");
    return;
  }

  $("participantAchievementImagePreview").innerHTML = "Изображение достижения ещё не выбрано";
  $("participantAchievementImagePreview").classList.add("empty");
}

function removeParticipantAchievementImage() {
  currentParticipantBlob = null;
  currentParticipantPreviewUrl = "";

  if ($("participantAchievementImageFile")) {
    $("participantAchievementImageFile").value = "";
  }

  renderParticipantAchievementPreview("");
}

async function fetchCharactersForAdminOptions() {
  const { data, error } = await supabase
    .from("characters")
    .select(`
      id,
      name,
      race,
      class_name,
      players(nickname)
    `)
    .order("name", { ascending: true });

  if (error) return [];
  return data || [];
}

function renderCharacterSearchResults(options, filterText = "") {
  const results = $("participantCharacterResults");
  if (!results) return;

  const normalized = String(filterText || "").trim().toLowerCase();

  const filtered = !normalized
    ? options
    : options.filter((char) => {
        const characterName = String(char.name || "").toLowerCase();
        const playerName = String(char.players?.nickname || "").toLowerCase();
        return characterName.includes(normalized) || playerName.includes(normalized);
      });

  if (!filtered.length) {
    results.innerHTML = `<div class="muted small-text">Ничего не найдено</div>`;
    return;
  }

  results.innerHTML = filtered.map((char) => `
    <button
      class="card-item"
      type="button"
      data-character-id="${char.id}"
      data-character-name="${escapeHtml(char.name || "Персонаж")}"
      data-player-name="${escapeHtml(char.players?.nickname || "Игрок")}"
      style="width:100%; text-align:left; margin-bottom:8px;"
    >
      <div><strong>${escapeHtml(char.name || "Персонаж")}</strong></div>
      <div class="muted small-text">
        ${escapeHtml(char.players?.nickname || "Игрок")}
        • ${cleanDisplayText(char.race || "—")}
        • ${cleanDisplayText(char.class_name || "—")}
      </div>
    </button>
  `).join("");

  results.querySelectorAll("[data-character-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCharacterId = button.dataset.characterId || null;

      if ($("participantCharacterSearch")) {
        $("participantCharacterSearch").value = button.dataset.characterName || "";
      }

      if ($("participantPlayerSearch")) {
        $("participantPlayerSearch").value = button.dataset.playerName || "";
      }

      results.innerHTML = "";
    });
  });
}

function fillParticipantFormFromPayload(payload) {
  selectedCharacterId = payload.characterId || null;

  if ($("participantCharacterSearch")) {
    $("participantCharacterSearch").value = payload.characterName || "";
  }

  if ($("participantPlayerSearch")) {
    $("participantPlayerSearch").value = payload.playerName || "";
  }

  if ($("participantAchievementTitle")) {
    $("participantAchievementTitle").value = payload.achievementTitle || "";
  }

  if ($("participantAchievementDescription")) {
    $("participantAchievementDescription").value = payload.achievementDescription || "";
  }

  currentParticipantPreviewUrl = payload.imagePreviewUrl || "";
currentParticipantBlob = payload.croppedImageBlob || null;

renderParticipantAchievementPreview(currentParticipantPreviewUrl);
}

function resetParticipantForm() {
  selectedCharacterId = null;
  currentParticipantBlob = null;
  currentParticipantPreviewUrl = "";

  if ($("participantPlayerSearch")) $("participantPlayerSearch").value = "";
  if ($("participantCharacterSearch")) $("participantCharacterSearch").value = "";
  if ($("participantAchievementTitle")) $("participantAchievementTitle").value = "";
  if ($("participantAchievementDescription")) $("participantAchievementDescription").value = "";
  if ($("participantAchievementImageFile")) $("participantAchievementImageFile").value = "";
  if ($("participantCharacterResults")) $("participantCharacterResults").innerHTML = "";
  if ($("participantPlayerResults")) $("participantPlayerResults").innerHTML = "";

  renderParticipantAchievementPreview("");
}

async function openParticipantModal(index = null) {
  editingParticipantIndex = index;

  if ($("participantModalTitle")) {
    $("participantModalTitle").textContent =
      index === null ? "Участник сессии" : "Редактировать участника";
  }

  resetParticipantForm();

  const options = await fetchCharactersForAdminOptions();

  if (index !== null && adminParticipants[index]) {
    fillParticipantFormFromPayload(adminParticipants[index]);
  }

  const bindSearch = () => {
    const currentText = $("participantCharacterSearch")?.value || $("participantPlayerSearch")?.value || "";
    renderCharacterSearchResults(options, currentText);
  };

  $("participantCharacterSearch").oninput = bindSearch;
  $("participantPlayerSearch").oninput = bindSearch;
  $("participantCharacterSearch").onfocus = bindSearch;
  $("participantPlayerSearch").onfocus = bindSearch;

  openModal("participantModal");
}

export function renderParticipantChips() {
  if (!$("sessionParticipantChips")) return;

  if (!adminParticipants.length) {
    $("sessionParticipantChips").innerHTML =
      `<div class="muted small-text">Участники ещё не добавлены</div>`;
    return;
  }

  $("sessionParticipantChips").innerHTML = adminParticipants.map((p, idx) => {
    const hasAchievement = Boolean(
      (p.achievementTitle && String(p.achievementTitle).trim()) ||
      (p.achievementDescription && String(p.achievementDescription).trim()) ||
      (p.imagePreviewUrl && String(p.imagePreviewUrl).trim())
    );

    const achievementTitle = p.achievementTitle
      ? escapeHtml(p.achievementTitle)
      : "Достижение пока не заполнено";

    const playerName = p.playerName
      ? escapeHtml(p.playerName)
      : "Игрок не указан";

    const imageHtml = p.imagePreviewUrl
      ? `
        <div class="participant-card-thumb-wrap">
          <img
            class="participant-card-thumb"
            src="${escapeHtml(p.imagePreviewUrl)}"
            alt="achievement preview"
          />
        </div>
      `
      : `
        <div class="participant-card-thumb-wrap participant-card-thumb-empty">
          <span>—</span>
        </div>
      `;

    return `
      <div class="participant-chip participant-chip-card ${hasAchievement ? "filled-chip" : ""}">
        ${imageHtml}

        <div class="participant-card-main">
          <div class="participant-card-topline">
            <strong class="participant-card-name">
              ${escapeHtml(p.characterName || "Персонаж")}
            </strong>

            <span class="participant-card-status ${hasAchievement ? "is-filled" : "is-empty"}">
              ${hasAchievement ? "Есть достижение" : "Пока без достижения"}
            </span>
          </div>

          <div class="participant-card-player">
            Игрок: ${playerName}
          </div>

          <div class="participant-card-achievement">
            ${achievementTitle}
          </div>
        </div>

        <div class="participant-chip-actions participant-card-actions">
          <button
            class="mini-icon-btn edit-participant-chip-btn"
            data-index="${idx}"
            type="button"
            title="Редактировать"
          >✏</button>

          <button
            class="mini-icon-btn remove-participant-chip-btn"
            data-index="${idx}"
            type="button"
            title="Удалить"
          >✕</button>
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".edit-participant-chip-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openParticipantModal(Number(btn.dataset.index));
    });
  });

  document.querySelectorAll(".remove-participant-chip-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      adminParticipants.splice(Number(btn.dataset.index), 1);
      renderParticipantChips();
    });
  });
}

async function saveParticipantFromModal() {
  if (!selectedCharacterId) {
    showToast("Сначала выбери персонажа из списка", "error");
    return;
  }

  const title = $("participantAchievementTitle")?.value.trim() || "";
  const description = $("participantAchievementDescription")?.value.trim() || "";

  const options = await fetchCharactersForAdminOptions();
  const selected = options.find((c) => c.id === selectedCharacterId);

  if (!selected) {
    showToast("Персонаж не найден", "error");
    return;
  }

  const payload = {
    characterId: selectedCharacterId,
    characterName: selected?.name || "Персонаж",
    playerName: selected?.players?.nickname || "Игрок",
    achievementTitle: title,
    achievementDescription: description,
    croppedImageBlob: currentParticipantBlob,
    imagePreviewUrl: currentParticipantPreviewUrl || ""
  };

  if (editingParticipantIndex === null) {
    adminParticipants.push(payload);
  } else {
    adminParticipants[editingParticipantIndex] = payload;
  }

  closeModal("participantModal");
  renderParticipantChips();
}

function openAchievementCropModal(imageSrc) {
  $("participantAchievementCropImage").src = imageSrc;
  openModal("participantAchievementCropModal");

  if (achievementCropper) {
    achievementCropper.destroy();
  }

  achievementCropper = new Cropper($("participantAchievementCropImage"), {
    aspectRatio: 1,
    viewMode: 1,
    dragMode: "move",
    autoCropArea: 1,
    responsive: true,
    background: false
  });
}

function closeAchievementCropModal() {
  closeModal("participantAchievementCropModal");

  if (achievementCropper) {
    achievementCropper.destroy();
    achievementCropper = null;
  }
}

async function applyAchievementCrop() {
  if (!achievementCropper) return;

  const canvas = achievementCropper.getCroppedCanvas({ width: 700, height: 700 });

  if (!canvas) {
    showToast("Не удалось обрезать изображение", "error");
    return;
  }

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.88);
  });

  if (!blob) {
    showToast("Не удалось подготовить изображение", "error");
    return;
  }

  currentParticipantBlob = blob;
currentParticipantPreviewUrl = URL.createObjectURL(blob);

renderParticipantAchievementPreview(currentParticipantPreviewUrl);

closeAchievementCropModal();
}

export function getAdminParticipants() {
  return adminParticipants;
}

export function setAdminParticipants(participants = []) {
  adminParticipants = Array.isArray(participants) ? participants : [];
  renderParticipantChips();
}

export function resetAdminParticipants() {
  adminParticipants = [];
  editingParticipantIndex = null;
  currentParticipantBlob = null;
  currentParticipantPreviewUrl = "";
  selectedCharacterId = null;
  renderParticipantChips();
}

export function initAdminParticipantsScreen() {
  $("openParticipantEditorBtn")?.addEventListener("click", () => openParticipantModal(null));
  $("closeParticipantModalBtn")?.addEventListener("click", () => closeModal("participantModal"));
  $("saveParticipantBtn")?.addEventListener("click", saveParticipantFromModal);

  $("participantAchievementImageFile")?.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Выбери изображение", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => openAchievementCropModal(e.target.result);
    reader.readAsDataURL(file);
  });

 $("closeParticipantAchievementCropModalBtn")?.addEventListener("click", closeAchievementCropModal);
$("applyParticipantAchievementCropBtn")?.addEventListener("click", applyAchievementCrop);
$("removeParticipantAchievementImageBtn")?.addEventListener("click", removeParticipantAchievementImage);
}