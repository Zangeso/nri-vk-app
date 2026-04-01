import { escapeHtml, cleanDisplayText, formatDate } from '../utils.js';

const DEFAULT_ACHIEVEMENT_IMAGE = "https://placehold.co/500x500?text=Achievement";
const DEFAULT_CHARACTER_AVATAR = "https://placehold.co/400x400?text=Hero";

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
      class="achievement-orb-btn"
      type="button"
      data-image="${encodeURIComponent(imageUrl)}"
      data-title="${encodeURIComponent(title)}"
      data-character="${encodeURIComponent(characterName)}"
      data-player=""
      data-description="${encodeURIComponent(description)}"
    >
      <div
        class="achievement-orb-image"
        style="background-image:url('${escapeHtml(imageUrl)}')"
      ></div>

      <div class="achievement-orb-body">
        <div class="achievement-orb-title">${escapeHtml(title)}</div>
        <div class="achievement-orb-character">${escapeHtml(characterName)}</div>
        <div class="achievement-orb-meta">
          ${escapeHtml(sessionTitle)}
          ${sessionDate ? ` • ${escapeHtml(sessionDate)}` : ""}
        </div>
      </div>
    </button>
  `;
}

export function renderAchievementsBoardHtml(achievements) {
  if (!achievements.length) {
    return `<div class="card-item">У тебя пока нет достижений.</div>`;
  }

  return `
    <div id="achievementsTrack" class="achievements-orb-track">
      ${achievements.map((item) => renderAchievementCard(item)).join("")}
    </div>
  `;
}