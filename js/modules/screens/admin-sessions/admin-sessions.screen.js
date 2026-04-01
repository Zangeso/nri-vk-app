import { showToast } from '../../toast.js';
import { openModal, closeModal } from '../../ui/modal.js';
import { escapeHtml, formatDate, cleanDisplayText } from '../../utils.js';

import {
  getSessions,
  getSessionById,
  getSessionEntries,
  saveSessionWithParticipants,
  deleteSession
} from '../../services/session.service.js';

import {
  getAdminParticipants,
  setAdminParticipants,
  resetAdminParticipants
} from '../admin-participants/admin-participants.screen.js';

import {
  loadCampaignOptionsForAdmin
} from '../admin-worlds/admin-worlds.screen.js';

let editingSessionId = null;
let sessionCoverCropper = null;
let sessionCoverBlob = null;
let sessionCoverPreviewUrl = "";

function $(id) {
  return document.getElementById(id);
}

function openSessionCoverCropModal(imageSrc) {
  $("sessionCoverCropImage").src = imageSrc;
  openModal("sessionCoverCropModal");

  if (sessionCoverCropper) {
    sessionCoverCropper.destroy();
  }

  sessionCoverCropper = new Cropper($("sessionCoverCropImage"), {
    aspectRatio: 16 / 9,
    viewMode: 1,
    dragMode: "move",
    autoCropArea: 1,
    responsive: true,
    background: false
  });
}

function closeSessionCoverCropModal() {
  closeModal("sessionCoverCropModal");

  if (sessionCoverCropper) {
    sessionCoverCropper.destroy();
    sessionCoverCropper = null;
  }
}

async function applySessionCoverCrop() {
  if (!sessionCoverCropper) return;

  const canvas = sessionCoverCropper.getCroppedCanvas({ width: 1280, height: 720 });

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

  sessionCoverBlob = blob;
  sessionCoverPreviewUrl = URL.createObjectURL(blob);

  $("sessionCoverPreview").innerHTML =
    `<img src="${sessionCoverPreviewUrl}" class="preview-session-cover" alt="preview" />`;
  $("sessionCoverPreview").classList.remove("empty");

  closeSessionCoverCropModal();
}

export function resetSessionEditor() {
  editingSessionId = null;

  $("sessionDate").value = "";
  $("sessionWorld").value = "";
  $("sessionCampaign").value = "";
  $("sessionTitle").value = "";
  $("sessionRecapLink").value = "";
  $("sessionTrackFile").value = "";
  $("sessionResultText").value = "";
  $("sessionCoverFile").value = "";

  sessionCoverBlob = null;
  sessionCoverPreviewUrl = "";

  $("sessionCoverPreview").innerHTML = "Изображение ещё не выбрано";
  $("sessionCoverPreview").classList.add("empty");

  resetAdminParticipants();

  $("publishSessionBtn").textContent = "Опубликовать сессию";
}

async function publishSession() {
  const date = $("sessionDate").value;
  const worldId = $("sessionWorld").value || null;
  const campaignId = $("sessionCampaign").value || null;
  const title = $("sessionTitle").value.trim();
  const recapLink = $("sessionRecapLink").value.trim();
  const resultText = $("sessionResultText").value.trim();
  const trackFile = $("sessionTrackFile")?.files?.[0] || null;

  if (!date) {
    showToast("Укажи дату сессии", "error");
    return;
  }

  if (!worldId) {
    showToast("Выбери мир", "error");
    return;
  }

  if (!title) {
    showToast("Укажи название записи", "error");
    return;
  }

  const participants = getAdminParticipants();

  if (!participants.length) {
    showToast("Добавь хотя бы одного участника", "error");
    return;
  }

  const sessionData = {
    date,
    worldId,
    campaignId,
    title,
    recapLink,
    resultText,
    trackFile,
    coverBlob: sessionCoverBlob
  };

  try {
    await saveSessionWithParticipants(editingSessionId, sessionData, participants);
    resetSessionEditor();
    await renderPublishedSessionsAdmin();
    showToast(editingSessionId ? "Сессия обновлена" : "Сессия опубликована", "success");
  } catch (error) {
    showToast("Ошибка публикации: " + (error?.message || "неизвестная ошибка"), "error");
  }
}

export async function renderPublishedSessionsAdmin() {
  if (!$("publishedSessionsList")) return;

  try {
    const sessions = await getSessions();

    if (!sessions.length) {
      $("publishedSessionsList").innerHTML =
        `<div class="card-item">Пока нет опубликованных сессий.</div>`;
      return;
    }

    $("publishedSessionsList").innerHTML = sessions.map((session) => `
      <div class="card-item compact-session-admin-card">
        <div class="compact-session-admin-top">
          <div>
            <h4>${escapeHtml(session.title)}</h4>
            <p class="muted">
              ${escapeHtml(formatDate(session.session_date))}
              • ${cleanDisplayText(session.worlds?.title || "—")}
              • ${cleanDisplayText(session.campaigns?.title || "Ваншот")}
            </p>
          </div>

          <div class="compact-session-admin-actions">
            <button class="icon-only-button edit-session-btn" data-id="${session.id}" type="button" title="Редактировать">✏</button>
            <button class="icon-only-button danger-icon-button delete-session-btn" data-id="${session.id}" type="button" title="Удалить">🗑</button>
          </div>
        </div>

        <p>${cleanDisplayText(session.short_story || "Итог приключения не заполнен.")}</p>
      </div>
    `).join("");

    document.querySelectorAll(".edit-session-btn").forEach((btn) => {
      btn.addEventListener("click", () => editSessionHandler(btn.dataset.id));
    });

    document.querySelectorAll(".delete-session-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteSessionHandler(btn.dataset.id));
    });
  } catch (error) {
    showToast("Ошибка загрузки сессий: " + error.message, "error");
  }
}

async function editSessionHandler(sessionId) {
  try {
    const session = await getSessionById(sessionId);
    const entries = await getSessionEntries(sessionId);

    editingSessionId = session.id;

    $("sessionDate").value = session.session_date || "";
    $("sessionWorld").value = session.world_id || "";
    await loadCampaignOptionsForAdmin(session.world_id || null);
    $("sessionCampaign").value = session.campaign_id || "";
    $("sessionTitle").value = session.title || "";
    $("sessionRecapLink").value = session.recap_link || "";
    $("sessionResultText").value = session.short_story || "";
    $("sessionTrackFile").value = "";
    $("sessionCoverFile").value = "";

    sessionCoverBlob = null;
    sessionCoverPreviewUrl = session.cover_url || "";

    if (session.cover_url) {
      $("sessionCoverPreview").innerHTML =
        `<img src="${escapeHtml(session.cover_url)}" class="preview-session-cover" alt="preview" />`;
      $("sessionCoverPreview").classList.remove("empty");
    } else {
      $("sessionCoverPreview").innerHTML = "Изображение ещё не выбрано";
      $("sessionCoverPreview").classList.add("empty");
    }

    const participantsFromEntries = (entries || []).map((entry) => ({
      characterId: entry.character_id,
      characterName: entry.characters?.name || "Персонаж",
      playerName: entry.characters?.players?.nickname || "Игрок",
      achievementTitle: entry.achievement_title || "",
      achievementDescription: entry.achievement_description || "",
      croppedImageBlob: null,
      imagePreviewUrl: entry.achievement_image_url || ""
    }));

    setAdminParticipants(participantsFromEntries);

    $("publishSessionBtn").textContent = "Сохранить изменения";
    document.querySelector('[data-main-tab="adminSessionTab"]')?.click();
  } catch (error) {
    showToast("Ошибка загрузки сессии: " + error.message, "error");
  }
}

async function deleteSessionHandler(sessionId) {
  if (!confirm("Удалить эту публикацию сессии и все связанные достижения?")) return;

  try {
    await deleteSession(sessionId);

    if (editingSessionId === sessionId) {
      resetSessionEditor();
    }

    showToast("Публикация удалена", "success");
    await renderPublishedSessionsAdmin();
  } catch (error) {
    showToast("Ошибка удаления: " + error.message, "error");
  }
}

export function initAdminSessionsScreen() {
  $("sessionCoverFile")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Выбери изображение", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => openSessionCoverCropModal(event.target.result);
    reader.readAsDataURL(file);
  });

  $("closeSessionCoverCropModalBtn")?.addEventListener("click", closeSessionCoverCropModal);
  $("applySessionCoverCropBtn")?.addEventListener("click", applySessionCoverCrop);

  $("publishSessionBtn")?.addEventListener("click", publishSession);
  $("resetSessionEditorBtn")?.addEventListener("click", resetSessionEditor);

  $("sessionWorld")?.addEventListener("change", async () => {
    const selectedWorldId = $("sessionWorld").value || null;
    await loadCampaignOptionsForAdmin(selectedWorldId);
    $("sessionCampaign").value = "";
  });
}