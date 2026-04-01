import { escapeHtml, truncateText, cleanDisplayText } from './utils.js';

const DEFAULT_CHARACTER_AVATAR = "https://placehold.co/400x400?text=Hero";

export function renderCharacterCard(character, worldName = "") {
  const race = character.race || "Не указана раса";
  const className = character.class_name || "Не указан класс";

  return `
    <button
      class="character-tile compact-entity-tile open-character-view-btn"
      data-id="${character.id}"
      type="button"
    >
      <img
        class="character-tile-avatar compact-character-avatar"
        src="${escapeHtml(character.avatar_url || DEFAULT_CHARACTER_AVATAR)}"
        alt="avatar"
      />

      <div class="character-tile-body compact-character-body">
        <div class="compact-character-head">
          <h4 class="character-name compact-character-name">${escapeHtml(character.name)}</h4>
          <p class="character-subline compact-character-meta">
            ${cleanDisplayText(race)}
            <span class="meta-dot">•</span>
            ${cleanDisplayText(className)}
          </p>
        </div>

        <p class="character-world-line compact-character-world">
          ${worldName ? `Мир: ${cleanDisplayText(worldName)}` : "Без мира"}
        </p>

        <p class="character-description compact-character-description">
          ${cleanDisplayText(truncateText(character.description, 72))}
        </p>
      </div>
    </button>
  `;
}
