import {
  getPlayerById,
  updatePlayerNickname as updatePlayerNicknameInDb
} from '../../services/player.service.js';

import {
  getFavoriteCharacterByPlayer,
  getLatestWorldByCharacterIds
} from '../../services/character.service.js';

import { openReadOnlyCharacterModal } from '../characters/characters.screen.js';
import { showToast } from '../../toast.js';
import { openModal, closeModal } from '../../ui/modal.js';

const DEFAULT_AVATAR = "https://placehold.co/200x200?text=Player";

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;")
    .split("'").join("&#39;");
}

function renderFavoriteCharacterEmpty() {
  return `
    <div class="dashboard-empty-state">
      Любимый персонаж появится после участия в сессиях.
    </div>
  `;
}

function buildFavoriteCharacterRow(character, worldName = "") {
  const race = character.race || "Раса не указана";
  const className = character.class_name || "Класс не указан";
  const metaLine = `${race} • ${className}`;

  return `
    <button
      class="dashboard-character-row dashboard-character-row-v2 player-favorite-character-card"
      data-id="${character.id}"
      type="button"
      title="Открыть карточку любимого персонажа"
    >
      <div class="dashboard-character-main">
        <div class="dashboard-character-name-row">
          <strong class="dashboard-character-name">
            ${escapeHtml(character.name || "Без имени")}
          </strong>
        </div>

        <div class="dashboard-character-meta">
          ${escapeHtml(metaLine)}
        </div>

        ${
          worldName
            ? `
              <div class="dashboard-character-world">
                Мир: ${escapeHtml(worldName)}
              </div>
            `
            : `
              <div class="dashboard-character-world dashboard-character-world-muted">
                Мир пока не указан
              </div>
            `
        }
      </div>

      <div class="dashboard-character-arrow" aria-hidden="true">★</div>
    </button>
  `;
}

function bindFavoriteCharacterCard(onOpenAchievement) {
  const button = document.querySelector(".player-favorite-character-card");
  if (!button || button.dataset.bound === "1") return;

  button.addEventListener("click", async () => {
    const characterId = button.dataset.id;
    if (!characterId) return;

    await openReadOnlyCharacterModal({
      characterId,
      onOpenAchievement
    });
  });

  button.dataset.bound = "1";
}

async function renderFavoriteCharacter(playerId, onOpenAchievement) {
  const container = $("favoriteCharacterCard");
  if (!container) return;

  try {
    const favoriteCharacter = await getFavoriteCharacterByPlayer(playerId);

    if (!favoriteCharacter) {
      container.innerHTML = renderFavoriteCharacterEmpty();
      return;
    }

    let worldName = "";

    try {
      const worldNameById = await getLatestWorldByCharacterIds([favoriteCharacter.id]);
      worldName = worldNameById[favoriteCharacter.id] || "";
    } catch (error) {
      console.warn("Не удалось загрузить мир любимого персонажа", error);
    }

    container.innerHTML = buildFavoriteCharacterRow(favoriteCharacter, worldName);
    bindFavoriteCharacterCard(onOpenAchievement);
  } catch (error) {
    console.warn("Не удалось загрузить любимого персонажа", error);
    container.innerHTML = renderFavoriteCharacterEmpty();
  }
}

export async function renderPlayerProfileScreen(playerId, options = {}) {
  const { onOpenAchievement = null } = options;

  try {
    const player = await getPlayerById(playerId);

    if (!player) {
      showToast("Игрок не найден", "error");
      return null;
    }

    if ($("playerAvatar")) {
      $("playerAvatar").src = player.avatar_url || DEFAULT_AVATAR;
    }

    if ($("playerNickname")) {
      $("playerNickname").textContent = player.nickname || "Игрок";
    }

    if ($("playerFullName")) {
      $("playerFullName").textContent = player.full_name || "Имя из VK появится позже";
    }

    if ($("nicknameInput")) {
      $("nicknameInput").value = player.nickname || "";
    }

    await renderFavoriteCharacter(playerId, onOpenAchievement);

    return player;
  } catch (error) {
    showToast("Ошибка загрузки профиля: " + error.message, "error");
    return null;
  }
}

export function openNicknameModal() {
  if ($("nicknameInput") && $("playerNickname")) {
    $("nicknameInput").value = $("playerNickname").textContent.trim();
  }

  openModal("nicknameModal");
}

export async function savePlayerNickname() {
  const playerId = localStorage.getItem("nri_player_id");
  const nickname = $("nicknameInput")?.value?.trim() || "";

  if (!playerId) {
    showToast("Игрок не найден", "error");
    return false;
  }

  if (!nickname) {
    showToast("Введите ник", "error");
    return false;
  }

  try {
    const updatedPlayer = await updatePlayerNicknameInDb(playerId, nickname);

    if ($("playerNickname")) {
      $("playerNickname").textContent = updatedPlayer.nickname || "Игрок";
    }

    if ($("nicknameInput")) {
      $("nicknameInput").value = updatedPlayer.nickname || "";
    }

    closeModal("nicknameModal");
    showToast("Ник сохранён", "success");
    return true;
  } catch (error) {
    showToast("Ошибка сохранения ника: " + error.message, "error");
    return false;
  }
}