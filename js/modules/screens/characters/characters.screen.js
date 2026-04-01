import {
  getCharactersByPlayer,
  getCharacterById,
  getLatestWorldByCharacterIds
} from '../../services/character.service.js';

import { getAchievementsByCharacter } from '../../services/character-achievement.service.js';
import { renderCharacterCard } from '../../ui/character-card.js';
import { renderCharacterViewModalContent } from '../../ui/character-view-modal.js';
import { bindCharacterViewActions } from '../../ui/character-view-actions.js';
import { saveInlineCharacterForm } from '../../ui/character-inline-edit.js';
import { removeCharacterById } from '../../ui/character-delete.js';
import { initHorizontalSlider } from '../../ui/horizontal-slider.js';
import { openModal, closeModal } from '../../ui/modal.js';
import { showToast } from '../../toast.js';

let pendingDeleteCharacterId = null;

function $(id) {
  return document.getElementById(id);
}

function renderCharactersEmptyState() {
  return '<div class="card-item">У тебя пока нет персонажей.</div>';
}

async function openCharacterViewModal({
  characterId,
  onOpenAchievement,
  onReloadCabinet
}) {
  if (!$("characterViewContent")) return;

  try {
    const character = await getCharacterById(characterId);
    const characterAchievements = await getAchievementsByCharacter(characterId);

    $("characterViewContent").innerHTML = renderCharacterViewModalContent(
      character,
      characterAchievements
    );

    openModal("characterViewModal");

    bindCharacterViewActions({
      characterId: character.id,
      originalTrackUrl: character.track_url || null,
      onSave: async (targetCharacterId, oldTrackUrl) => {
        try {
          await saveInlineCharacterForm(targetCharacterId, oldTrackUrl);

          showToast("Персонаж обновлён", "success");

          closeModal("characterViewModal");

          if (onReloadCabinet) {
            await onReloadCabinet();
          }

          await openCharacterViewModal({
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
            180
          );
        }
      }
    });
  } catch (error) {
    showToast("Ошибка загрузки персонажа: " + error.message, "error");
  }
}

function bindCharacterCards({ onOpenAchievement, onReloadCabinet }) {
  document.querySelectorAll(".open-character-view-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      await openCharacterViewModal({
        characterId: button.getAttribute("data-id"),
        onOpenAchievement,
        onReloadCabinet
      });
    });
  });
}

export function initCharacterDeleteConfirm({ onReloadCabinet }) {
  $("closeDeleteConfirmModalBtn")?.addEventListener("click", () => closeModal("deleteConfirmModal"));
  $("cancelDeleteBtn")?.addEventListener("click", () => closeModal("deleteConfirmModal"));

  $("confirmDeleteBtn")?.addEventListener("click", async () => {
    if (!pendingDeleteCharacterId) {
      showToast("Персонаж не выбран", "error");
      return;
    }

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
  if (!$("charactersList")) return;

  try {
    const characters = await getCharactersByPlayer(playerId);

    if ($("statCharacters")) {
      $("statCharacters").textContent = String(characters.length);
    }

    if (!characters.length) {
      $("charactersList").innerHTML = renderCharactersEmptyState();
      initHorizontalSlider("charactersTrack", "charactersPrevBtn", "charactersNextBtn", 320);
      return;
    }

    const worldMap = await getLatestWorldByCharacterIds(
      characters.map((character) => character.id)
    );

    const cardsHtml = characters.map((character) => {
      return renderCharacterCard(character, worldMap[character.id] || "");
    }).join("");

    $("charactersList").innerHTML = `
      <div id="charactersTrack" class="characters-scroll-track">
        ${cardsHtml}
      </div>
    `;

    bindCharacterCards({ onOpenAchievement, onReloadCabinet });

    initHorizontalSlider("charactersTrack", "charactersPrevBtn", "charactersNextBtn", 320);
  } catch (error) {
    showToast("Ошибка загрузки персонажей: " + error.message, "error");
  }
}