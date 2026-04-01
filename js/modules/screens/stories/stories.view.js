import { escapeHtml, formatDate, cleanDisplayText } from '../../utils.js';

const DEFAULT_ACHIEVEMENT_IMAGE = "https://placehold.co/500x500?text=Achievement";

export function renderStoriesEmptyState(message) {
  return `<div class="card-item">${escapeHtml(message)}</div>`;
}

function renderAchievedEntries(entries) {
  return `
    <div class="feed-achievements-grid-compact">
      ${entries.map((entry) => `
        <button
          class="feed-achievement-orb-tile"
          type="button"
          data-image="${encodeURIComponent(entry.achievement_image_url || DEFAULT_ACHIEVEMENT_IMAGE)}"
          data-title="${encodeURIComponent(entry.achievement_title || "Участие в сессии")}"
          data-character="${encodeURIComponent(entry.characters?.name || "Персонаж")}"
          data-player="${encodeURIComponent(entry.characters?.players?.nickname || "Игрок")}"
          data-description="${encodeURIComponent(entry.achievement_description || "Описание не указано")}"
        >
          <div
            class="feed-achievement-orb-circle"
            style="background-image:url('${escapeHtml(entry.achievement_image_url || DEFAULT_ACHIEVEMENT_IMAGE)}')"
          ></div>

          <div class="feed-achievement-orb-title">
            ${escapeHtml(entry.achievement_title || "Участие в сессии")}
          </div>

          <div class="feed-achievement-orb-character">
            ${escapeHtml(entry.characters?.name || "Персонаж")}
          </div>

          <div class="feed-achievement-orb-player">
            ${escapeHtml(entry.characters?.players?.nickname || "Игрок")}
          </div>
        </button>
      `).join("")}
    </div>
  `;
}

function renderPlainEntries(entries) {
  return `
    <div class="participant-list-plain">
      ${entries.map((entry) => `
        <div class="participant-plain-row">
          ${escapeHtml(entry.characters?.name || "Персонаж")}
          <span class="muted"> • ${escapeHtml(entry.characters?.race || "—")}</span>
          <span class="muted"> • ${escapeHtml(entry.characters?.players?.nickname || "Игрок")}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderSessionCard(session, entries) {
  const achievedEntries = entries.filter((entry) => {
    return entry.achievement_title || entry.achievement_image_url || entry.achievement_description;
  });

  const entriesHtml = achievedEntries.length
    ? renderAchievedEntries(achievedEntries)
    : renderPlainEntries(entries);

  return `
    <div class="card premium-feed-session-card">
      <p class="feed-session-meta-line">
        ${escapeHtml(formatDate(session.session_date))}
        • Мир: ${cleanDisplayText(session.worlds?.title || "—")}
        • Кампания: ${cleanDisplayText(session.campaigns?.title || "Ваншот")}
      </p>

      <div class="feed-title-row">
        <h3 class="feed-session-title">${escapeHtml(session.title || "Запись приключения")}</h3>
        ${session.recap_link
          ? `<a class="feed-title-link" href="${escapeHtml(session.recap_link)}" target="_blank" rel="noopener noreferrer">Открыть пересказ</a>`
          : ""
        }
      </div>

      ${session.cover_url
        ? `<img class="session-main-cover premium-session-cover" src="${escapeHtml(session.cover_url)}" alt="session cover" />`
        : ""
      }

      ${entriesHtml}

      ${session.session_track_url
        ? `
          <div class="feed-session-audio">
            <audio class="character-audio-player" controls preload="none">
              <source src="${escapeHtml(session.session_track_url)}" />
            </audio>
          </div>
        `
        : ""
      }

      <div class="feed-session-result">
        <strong>Результат приключения</strong>
        <p>${cleanDisplayText(session.short_story || "Итог приключения не заполнен.")}</p>
      </div>
    </div>
  `;
}

export function renderStoriesListHtml(uniqueSessions, entriesBySession) {
  return uniqueSessions.map((session) => {
    const entries = entriesBySession[session.id] || [];
    return renderSessionCard(session, entries);
  }).join("");
}