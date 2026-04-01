import { getAchievementsByPlayer } from '../../services/achievement.service.js';
import { renderAchievementsBoardHtml } from '../../ui/achievement-board.js';
import { initHorizontalSlider } from '../../ui/horizontal-slider.js';
import { showToast } from '../../toast.js';

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

export async function renderAchievementsScreen({ playerId, onOpenAchievement }) {
  if (!$("achievementBoard")) return;

  try {
    const achievements = await getAchievementsByPlayer(playerId);

    if ($("statAchievements")) {
      $("statAchievements").textContent = String(achievements.length);
    }

    $("achievementBoard").innerHTML = renderAchievementsBoardHtml(achievements);

    bindAchievementButtons(onOpenAchievement);

    if (achievements.length) {
      initHorizontalSlider(
        "achievementsTrack",
        "achievementsPrevBtn",
        "achievementsNextBtn",
        180
      );
    }
  } catch (error) {
    showToast("Ошибка загрузки достижений: " + error.message, "error");
  }
}