import { escapeHtml } from '../utils.js';

const DEFAULT_ACHIEVEMENT_IMAGE = "https://placehold.co/500x500?text=Achievement";

function renderAchievementCard(item) {
  const imageUrl = item.image_url || DEFAULT_ACHIEVEMENT_IMAGE;
  const title = item.title || "Достижение";
  const description = item.description || "Описание не указано";
  const characterName = item.characters?.name || "Персонаж";

  return `
    <button
      class="achievement-orb-btn compact-achievement-tile achievement-grid-card"
      type="button"
      data-image="${encodeURIComponent(imageUrl)}"
      data-title="${encodeURIComponent(title)}"
      data-character="${encodeURIComponent(characterName)}"
      data-player=""
      data-description="${encodeURIComponent(description)}"
      title="${escapeHtml(title)}"
    >
      <div
        class="achievement-orb-image compact-achievement-image achievement-grid-image"
        style="background-image:url('${escapeHtml(imageUrl)}')"
      ></div>

      <div class="compact-achievement-body achievement-grid-body">
        <div class="achievement-orb-title compact-achievement-title achievement-grid-title">
          ${escapeHtml(title)}
        </div>

        <div class="achievement-orb-character compact-achievement-character achievement-grid-character">
          ${escapeHtml(characterName)}
        </div>
      </div>
    </button>
  `;
}

export function renderAchievementsBoardHtml(achievements) {
  if (!achievements.length) {
    return `
      <div class="card-item compact-empty-tile compact-achievements-empty">
        <div class="compact-achievements-empty-inner">
          <div class="compact-achievements-empty-title">Пока пусто</div>
          <div class="compact-achievements-empty-text">
            У тебя пока нет достижений, но они появятся после новых сессий.
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div id="achievementsTrack" class="achievements-grid-track">
      ${achievements.map((item) => renderAchievementCard(item)).join("")}
    </div>
  `;
}