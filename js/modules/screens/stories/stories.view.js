import { escapeHtml, formatDate, cleanDisplayText, truncateText } from '../../utils.js';

const DEFAULT_ACHIEVEMENT_IMAGE = "https://placehold.co/500x500?text=Achievement";

export function renderStoriesEmptyState(message) {
  return `
    <div class="feed-empty-state-card">
      <div class="feed-empty-state-title">Лента пока пустая</div>
      <div class="feed-empty-state-text">${escapeHtml(message)}</div>
    </div>
  `;
}

function renderAchievedEntries(entries) {
  return `
    <div class="feed-achievements-grid-compact feed-achievements-grid-v2">
      ${entries.map((entry) => `
        <button
          class="feed-achievement-orb-tile feed-achievement-orb-tile-v2"
          type="button"
          data-image="${encodeURIComponent(entry.achievement_image_url || DEFAULT_ACHIEVEMENT_IMAGE)}"
          data-title="${encodeURIComponent(entry.achievement_title || "Участие в сессии")}"
          data-character="${encodeURIComponent(entry.characters?.name || "Персонаж")}"
          data-player="${encodeURIComponent(entry.characters?.players?.nickname || "Игрок")}"
          data-description="${encodeURIComponent(entry.achievement_description || "Описание не указано")}"
          title="${escapeHtml(entry.achievement_title || "Участие в сессии")}"
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
    <div class="participant-list-plain participant-list-plain-v2">
      ${entries.map((entry) => `
        <div class="participant-plain-row participant-plain-row-v2">
          <div class="participant-plain-name">
            ${escapeHtml(entry.characters?.name || "Персонаж")}
          </div>

          <div class="participant-plain-meta">
            ${escapeHtml(entry.characters?.race || "—")}
            • ${escapeHtml(entry.characters?.players?.nickname || "Игрок")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderSessionCard(session, entries, index = 0) {
  const achievedEntries = entries.filter((entry) => {
    return entry.achievement_title || entry.achievement_image_url || entry.achievement_description;
  });

  const entriesHtml = achievedEntries.length
    ? renderAchievedEntries(achievedEntries)
    : renderPlainEntries(entries);

  const previewResult = truncateText(
    session.short_story || "Итог приключения не заполнен.",
    120
  );

  const fullResult = truncateText(
    session.short_story || "Итог приключения не заполнен.",
    320
  );

  const canExpand = Boolean(
    session.cover_url ||
    session.session_track_url ||
    entries.length > 0 ||
    (session.short_story && String(session.short_story).trim().length > 120)
  );

  return `
    <article class="feed-session-card-v2 ${index === 0 ? "feed-session-card-featured" : ""}">
      <div class="feed-session-card-top">
        <div class="feed-session-meta-chips">
          <span class="feed-meta-chip">
            ${escapeHtml(formatDate(session.session_date) || "Без даты")}
          </span>
          <span class="feed-meta-chip">
            Мир: ${cleanDisplayText(session.worlds?.title || "—")}
          </span>
          <span class="feed-meta-chip">
            Кампания: ${cleanDisplayText(session.campaigns?.title || "Ваншот")}
          </span>
        </div>
      </div>

      <div class="feed-session-headline">
        <div class="feed-session-headline-main">
          <h3 class="feed-session-title">
            ${escapeHtml(session.title || "Запись приключения")}
          </h3>
        </div>

        ${
          session.recap_link
            ? `
              <a
                class="feed-title-link feed-title-link-v2"
                href="${escapeHtml(session.recap_link)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Пересказ ↗
              </a>
            `
            : ""
        }
      </div>

      <section class="feed-section-block feed-result-block">
  <div class="feed-section-title">Итог приключения</div>
  <p class="feed-result-text feed-result-collapsed">
    ${cleanDisplayText(fullResult)}
  </p>
</section>

      ${
        canExpand
          ? `
            <button
              class="feed-expand-btn"
              type="button"
              data-feed-toggle
              aria-expanded="false"
            >
              <span class="feed-expand-btn-text">Подробнее</span>
              <span class="feed-expand-btn-icon" aria-hidden="true">⌄</span>
            </button>

            <div class="feed-session-extra" data-feed-extra hidden>
              ${
                session.cover_url
                  ? `
                    <div class="feed-cover-wrap">
                      <img
                        class="session-main-cover premium-session-cover feed-session-cover-v2"
                        src="${escapeHtml(session.cover_url)}"
                        alt="session cover"
                      />
                    </div>
                  `
                  : ""
              }

              <section class="feed-section-block">
                <div class="feed-section-title">
                  ${achievedEntries.length ? "Достижения сессии" : "Участники сессии"}
                </div>
                ${entriesHtml}
              </section>

              ${
                session.session_track_url
                  ? `
                    <section class="feed-section-block feed-audio-block">
                      <div class="feed-section-title">Трек сессии</div>
                      <div class="feed-session-audio">
                        <audio class="character-audio-player" controls preload="none">
                          <source src="${escapeHtml(session.session_track_url)}" />
                        </audio>
                      </div>
                    </section>
                  `
                  : ""
              }

              
            </div>
          `
          : ""
      }
    </article>
  `;
}

export function renderStoriesListHtml(uniqueSessions, entriesBySession) {
  return `
    <div class="feed-session-stack">
      ${uniqueSessions.map((session, index) => {
        const entries = entriesBySession[session.id] || [];
        return renderSessionCard(session, entries, index);
      }).join("")}
    </div>
  `;
}