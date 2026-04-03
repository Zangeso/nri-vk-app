import { getAchievementsByPlayer } from '../../services/achievement.service.js';
import { renderAchievementsBoardHtml } from '../../ui/achievement-board.js';
import { showToast } from '../../toast.js';

let currentAchievementSearchQuery = "";

function $(id) {
  return document.getElementById(id);
}

function bindAchievementButtons(onOpenAchievement) {
  document.querySelectorAll(".achievement-orb-btn").forEach((button) => {
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

function filterAchievements(achievements = []) {
  const query = currentAchievementSearchQuery.trim().toLowerCase();
  if (!query) return [...achievements];

  return achievements.filter((item) => {
    const title = String(item.title || "").toLowerCase();
    const character = String(item.characters?.name || "").toLowerCase();
    return title.includes(query) || character.includes(query);
  });
}

function renderAchievementsList({ achievements, onOpenAchievement }) {
  const container = $("achievementBoard");
  if (!container) return;

  const filteredAchievements = filterAchievements(achievements);

  if (!filteredAchievements.length) {
    container.innerHTML = currentAchievementSearchQuery.trim()
      ? '<div class="dashboard-empty-state">Ничего не найдено.</div>'
      : renderAchievementsBoardHtml([]);
    return;
  }

  container.innerHTML = renderAchievementsBoardHtml(filteredAchievements);
  bindAchievementButtons(onOpenAchievement);
}

function bindAchievementSearch({ achievements, onOpenAchievement }) {
  const input = $("achievementSearchInput");
  if (!input) return;

  input.oninput = () => {
    currentAchievementSearchQuery = input.value || "";
    renderAchievementsList({ achievements, onOpenAchievement });
  };
}

export async function renderAchievementsScreen({ playerId, onOpenAchievement }) {
  if (!$("achievementBoard")) return;

  try {
    const achievements = await getAchievementsByPlayer(playerId);

    if ($("statAchievements")) {
      $("statAchievements").textContent = String(achievements.length);
    }

    renderAchievementsList({
      achievements,
      onOpenAchievement
    });

    bindAchievementSearch({
      achievements,
      onOpenAchievement
    });
  } catch (error) {
    showToast("Ошибка загрузки достижений: " + error.message, "error");
  }
}