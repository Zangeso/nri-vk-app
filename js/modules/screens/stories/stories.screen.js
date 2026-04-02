import {
  getCharacterIdsByPlayer,
  getUniqueSessionsByCharacterIds,
  getSessionEntriesBySessionIds
} from '../../services/story.service.js';

import { showToast } from '../../toast.js';
import {
  renderStoriesEmptyState,
  renderStoriesListHtml
} from './stories.view.js';

function $(id) {
  return document.getElementById(id);
}

function bindStoryAchievementButtons(onOpenAchievement) {
  document.querySelectorAll(".feed-achievement-orb-tile").forEach((button) => {
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
}

function bindFeedExpandButtons() {
  document.querySelectorAll("[data-feed-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".feed-session-card-v2");
      if (!card) return;

      const extra = card.querySelector("[data-feed-extra]");
      if (!extra) return;

      const isOpen = button.getAttribute("aria-expanded") === "true";

      button.setAttribute("aria-expanded", String(!isOpen));
      button.classList.toggle("is-open", !isOpen);
      extra.hidden = isOpen;

      const textNode = button.querySelector(".feed-expand-btn-text");
      if (textNode) {
        textNode.textContent = isOpen ? "Подробнее" : "Скрыть";
      }
    });
  });
}

export async function renderStoriesScreen({ playerId, onOpenAchievement }) {
  if (!$("storiesList")) return;

  try {
    const characterIds = await getCharacterIdsByPlayer(playerId);

    if (!characterIds.length) {
      if ($("statSessions")) {
        $("statSessions").textContent = "0";
      }

      $("storiesList").innerHTML = renderStoriesEmptyState(
        "Лента появится после участия в сессиях."
      );
      return;
    }

    const uniqueSessions = await getUniqueSessionsByCharacterIds(characterIds);

    if ($("statSessions")) {
      $("statSessions").textContent = String(uniqueSessions.length);
    }

    if (!uniqueSessions.length) {
      $("storiesList").innerHTML = renderStoriesEmptyState(
        "Игрок пока не участвовал в сессиях."
      );
      return;
    }

    const allSessionIds = uniqueSessions.map((session) => session.id);
    const entriesBySession = await getSessionEntriesBySessionIds(allSessionIds);

    $("storiesList").innerHTML = renderStoriesListHtml(uniqueSessions, entriesBySession);

    bindStoryAchievementButtons(onOpenAchievement);
    bindFeedExpandButtons();
  } catch (error) {
    showToast("Ошибка загрузки ленты: " + error.message, "error");
  }
}