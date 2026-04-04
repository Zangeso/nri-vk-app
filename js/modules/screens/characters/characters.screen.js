import {
  getCharactersByPlayer,
  getCharacterById,
  getWorldsByCharacterIds
} from '../../services/character.service.js';

import { getAchievementsByCharacter } from '../../services/character-achievement.service.js';
import {
  getCharacterIdsByPlayer,
  getUniqueSessionsByCharacterIds
} from '../../services/story.service.js';

import { renderCharacterViewModalContent } from '../../ui/character-view-modal.js';
import { bindCharacterViewActions } from '../../ui/character-view-actions.js';
import { saveInlineCharacterForm } from '../../ui/character-inline-edit.js';
import { removeCharacterById } from '../../ui/character-delete.js';
import { initHorizontalSlider } from '../../ui/horizontal-slider.js';
import { openModal, closeModal } from '../../ui/modal.js';
import { showToast } from '../../toast.js';
import { supabase } from '../../supabase.js';

let pendingDeleteCharacterId = null;
let currentSearchQuery = "";

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

function renderCharactersEmptyState() {
  return '<div class="dashboard-empty-state">У тебя пока нет персонажей.</div>';
}

function buildCharacterRow(character, worldNames = []) {
  const race = character.race || "Раса не указана";
  const className = character.class_name || "Класс не указан";
  const metaLine = `${race} • ${className}`;

  const worldsLine = Array.isArray(worldNames) && worldNames.length
    ? `Миры: ${worldNames.map((item) => escapeHtml(item)).join(" • ")}`
    : "Миры пока не указаны";

  return `
    <button
      class="dashboard-character-row dashboard-character-row-v2"
      data-id="${character.id}"
      type="button"
      title="Открыть карточку персонажа"
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

        <div class="dashboard-character-world dashboard-character-world-muted">
          ${worldsLine}
        </div>
      </div>
    </button>
  `;
}

function filterCharacters(characters) {
  const query = currentSearchQuery.trim().toLowerCase();

  if (!query) return [...characters];

  return characters.filter((character) => {
    const name = String(character.name || "").toLowerCase();
    return name.includes(query);
  });
}

async function getRecentCharacterOrder(playerId, characters) {
  const ids = characters.map((item) => item.id);
  if (!ids.length) return characters;

  try {
    const ownCharacterIds = await getCharacterIdsByPlayer(playerId);
    const sessions = await getUniqueSessionsByCharacterIds(ownCharacterIds);
    const sessionIds = sessions.map((session) => session.id);

    if (!sessionIds.length) return characters;

    const { data, error } = await supabase
      .from("session_entries")
      .select(`
        character_id,
        sessions (
          id,
          session_date
        )
      `)
      .in("character_id", ids)
      .in("session_id", sessionIds);

    if (error) throw error;

    const freshMap = new Map();

    for (const row of data || []) {
      const sessionDate = row.sessions?.session_date
        ? new Date(row.sessions.session_date).getTime()
        : 0;

      const currentDate = freshMap.get(row.character_id) || 0;
      if (sessionDate > currentDate) {
        freshMap.set(row.character_id, sessionDate);
      }
    }

    return [...characters].sort((a, b) => {
      const aDate = freshMap.get(a.id) || 0;
      const bDate = freshMap.get(b.id) || 0;
      return bDate - aDate;
    });
  } catch (error) {
    console.warn("Не удалось отсортировать персонажей по свежести сессии", error);
    return characters;
  }
}

async function openCharacterModalFromRow({
  characterId,
  onOpenAchievement,
  onReloadCabinet,
  readOnly = false,
  ownerLabel = ""
}) {
  if (!$("characterViewContent")) return;

  try {
    const character = await getCharacterById(characterId);
    const characterAchievements = await getAchievementsByCharacter(characterId);

    let worldNames = [];
    try {
      const worldsByCharacterId = await getWorldsByCharacterIds([characterId]);
      worldNames = worldsByCharacterId[characterId] || [];
    } catch (error) {
      console.warn("Не удалось загрузить миры персонажа", error);
    }

    $("characterViewContent").innerHTML = renderCharacterViewModalContent(
      character,
      characterAchievements,
      {
        readOnly,
        ownerLabel,
        worldNames
      }
    );

    openModal("characterViewModal");

    const modalHeaderActions = document.getElementById("characterModalHeaderActions");
    if (modalHeaderActions) {
      if (readOnly) {
        modalHeaderActions.innerHTML = "";
      } else {
        modalHeaderActions.innerHTML = `
          <button
            id="openInlineEditBtn"
            class="icon-only-button"
            type="button"
            title="Редактировать"
            aria-label="Редактировать"
          >✏</button>

          <button
            id="openInlineDeleteBtn"
            class="icon-only-button danger-icon-button"
            type="button"
            title="Удалить"
            aria-label="Удалить"
          >🗑</button>
        `;
      }
    }

    if (readOnly) {
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

      if (characterAchievements.length) {
        initHorizontalSlider(
          "characterAchievementsTrack",
          "characterAchievementsPrevBtn",
          "characterAchievementsNextBtn",
          240
        );
      }

      return;
    }

    bindCharacterViewActions({
      characterId: character.id,
      originalTrackUrl: character.track_url || null,
      originalAvatarUrl: character.avatar_url || null,
      onSave: async (targetCharacterId, oldTrackUrl, oldAvatarUrl) => {
        try {
          await saveInlineCharacterForm(
            targetCharacterId,
            oldTrackUrl,
            oldAvatarUrl
          );

          showToast("Персонаж обновлён", "success");
          closeModal("characterViewModal");

          if (onReloadCabinet) {
            await onReloadCabinet();
          }

          await openCharacterModalFromRow({
            characterId: targetCharacterId,
            onOpenAchievement,
            onReloadCabinet
          });
        } catch (error) {
          showToast("Ошибка сохранения: " + error.message, "error");
        }
      },
      onDelete: (targetCharacterId) => {
        pendingDeleteCharacterId = targetCharacterId;
        openModal("deleteConfirmModal");
      },
      onOpenAchievement,
      onInitSlider: () => {
        if (characterAchievements.length) {
          initHorizontalSlider(
            "characterAchievementsTrack",
            "characterAchievementsPrevBtn",
            "characterAchievementsNextBtn",
            240
          );
        }
      }
    });
  } catch (error) {
    showToast("Ошибка загрузки персонажа: " + error.message, "error");
  }
}

function renderCharactersRows({
  characters,
  worldsByCharacterId,
  onOpenAchievement,
  onReloadCabinet
}) {
  const container = $("charactersList");
  if (!container) return;

  const filteredCharacters = filterCharacters(characters);

  if (!filteredCharacters.length) {
    container.innerHTML = currentSearchQuery.trim()
      ? '<div class="dashboard-empty-state">Ничего не найдено.</div>'
      : renderCharactersEmptyState();
    return;
  }

  container.innerHTML = filteredCharacters
    .map((character) => buildCharacterRow(character, worldsByCharacterId[character.id] || []))
    .join("");

  container.querySelectorAll(".dashboard-character-row").forEach((button) => {
    button.addEventListener("click", async () => {
      await openCharacterModalFromRow({
        characterId: button.dataset.id,
        onOpenAchievement,
        onReloadCabinet
      });
    });
  });
}

function bindCharacterSearch({
  characters,
  worldsByCharacterId,
  onOpenAchievement,
  onReloadCabinet
}) {
  const input = $("characterSearchInput");
  if (!input) return;

  input.value = currentSearchQuery;

  input.oninput = () => {
    currentSearchQuery = input.value || "";

    renderCharactersRows({
      characters,
      worldsByCharacterId,
      onOpenAchievement,
      onReloadCabinet
    });
  };
}

export function initCharacterDeleteConfirm({ onReloadCabinet }) {
  $("closeDeleteConfirmModalBtn")?.addEventListener("click", () => {
    closeModal("deleteConfirmModal");
    pendingDeleteCharacterId = null;
  });

  $("cancelDeleteBtn")?.addEventListener("click", () => {
    closeModal("deleteConfirmModal");
    pendingDeleteCharacterId = null;
  });

  $("confirmDeleteBtn")?.addEventListener("click", async () => {
    if (!pendingDeleteCharacterId) return;

    try {
      await removeCharacterById(pendingDeleteCharacterId);
      closeModal("deleteConfirmModal");
      closeModal("characterViewModal");
      pendingDeleteCharacterId = null;

      showToast("Персонаж удалён", "success");

      if (onReloadCabinet) {
        await onReloadCabinet();
      }
    } catch (error) {
      showToast("Ошибка удаления: " + error.message, "error");
    }
  });
}

export async function renderCharactersScreen({
  playerId,
  onOpenAchievement,
  onReloadCabinet
}) {
  const container = $("charactersList");
  if (!container) return;

  try {
    let characters = await getCharactersByPlayer(playerId);

    if ($("statCharacters")) {
      $("statCharacters").textContent = String(characters.length);
    }

    if (!characters.length) {
      container.innerHTML = renderCharactersEmptyState();
      return;
    }

    characters = await getRecentCharacterOrder(playerId, characters);

    let worldsByCharacterId = {};
    try {
      worldsByCharacterId = await getWorldsByCharacterIds(
        characters.map((character) => character.id)
      );
    } catch (error) {
      console.warn("Не удалось загрузить миры персонажей", error);
    }

    renderCharactersRows({
      characters,
      worldsByCharacterId,
      onOpenAchievement,
      onReloadCabinet
    });

    bindCharacterSearch({
      characters,
      worldsByCharacterId,
      onOpenAchievement,
      onReloadCabinet
    });
  } catch (error) {
    container.innerHTML = '<div class="dashboard-empty-state">Не удалось загрузить персонажей.</div>';
    showToast("Ошибка загрузки персонажей: " + error.message, "error");
  }
}

export async function openReadOnlyCharacterModal({
  characterId,
  ownerLabel = "",
  onOpenAchievement
}) {
  await openCharacterModalFromRow({
    characterId,
    ownerLabel,
    readOnly: true,
    onOpenAchievement,
    onReloadCabinet: null
  });
}