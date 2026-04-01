import { escapeHtml, truncateText, cleanDisplayText } from '../utils.js';

const DEFAULT_CHARACTER_AVATAR = "https://placehold.co/400x400?text=Hero";

export function renderCharacterCard(character, worldName = "") {
  const race = character.race || "Не указана раса";
  const className = character.class_name || "Не указан класс";

  return `
    <button
      class="character-tile premium-character-tile open-character-view-btn"
      data-id="${character.id}"
      type="button"
    >
      <img
        class="character-tile-avatar"
        src="${escapeHtml(character.avatar_url || DEFAULT_CHARACTER_AVATAR)}"
        alt="avatar"
      />

      <div class="character-tile-body">
        <div class="character-tile-top">
          <h4 class="character-name">${escapeHtml(character.name)}</h4>

          <p class="character-subline">
            ${cleanDisplayText(race)}
            <span class="meta-dot">•</span>
            ${cleanDisplayText(className)}
          </p>

          <p class="character-world-line">
            ${worldName ? `Мир: ${cleanDisplayText(worldName)}` : '&nbsp;'}
          </p>
        </div>

        <p class="character-description">
          ${cleanDisplayText(truncateText(character.description))}
        </p>
      </div>
    </button>
  `;
}