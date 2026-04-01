import { escapeHtml, formatDate } from '../utils.js';

const DEFAULT_ACHIEVEMENT_IMAGE = "https://placehold.co/500x500?text=Achievement";

function renderAchievementCard(item) {
  const imageUrl = item.image_url || DEFAULT_ACHIEVEMENT_IMAGE;
  const title = item.title || "Достижение";
  const description = item.description || "Описание не указано";
  const characterName = item.characters?.name || "Персонаж";
  const sessionTitle = item.sessions?.title || "Без сессии";
  const sessionDate = item.sessions?.session_date
    ? formatDate(item.sessions.session_date)
    : "";

  return `
    <button
      class="achievement-orb-btn compact-achievement-tile"
      type="button"
      data-image="${encodeURIComponent(imageUrl)}"
      data-title="${encodeURIComponent(title)}"
      data-character="${encodeURIComponent(characterName)}"
      data-player=""
      data-description="${encodeURIComponent(description)}"
    >
      <div
        class="achievement-orb-image compact-achievement-image"
        style="background-image:url('${escapeHtml(imageUrl)}')"
      ></div>

      <div class="compact-achievement-body">
        <div class="achievement-orb-title compact-achievement-title">${escapeHtml(title)}</div>
        <div class="achievement-orb-character compact-achievement-character">${escapeHtml(characterName)}</div>
        <div class="achievement-orb-meta compact-achievement-meta">
          ${escapeHtml(sessionTitle)}
          ${sessionDate ? ` • ${escapeHtml(sessionDate)}` : ""}
        </div>
      </div>
    </button>
  `;
}

export function renderAchievementsBoardHtml(achievements) {
  if (!achievements.length) {
    return `<div class="card-item compact-empty-tile">У тебя пока нет достижений.</div>`;
  }

  return `
    <div id="achievementsTrack" class="achievements-orb-track compact-achievements-track">
      ${achievements.map((item) => renderAchievementCard(item)).join("")}
    </div>
  `;
}
