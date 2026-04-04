import { escapeHtml, cleanDisplayText } from '../utils.js';

const DEFAULT_CHARACTER_AVATAR = "https://placehold.co/400x400?text=Hero";
const DEFAULT_ACHIEVEMENT_IMAGE = "https://placehold.co/500x500?text=Achievement";

function renderTrackBlock(character, readOnly = false) {
  return `
    <div class="compact-character-track-box compact-character-track-box--tight">
      <div class="character-section-label">Личный трек</div>

      ${
        character.track_url
          ? `
            <audio class="character-audio-player compact-character-audio" controls preload="none">
              <source src="${escapeHtml(character.track_url)}" />
            </audio>
          `
          : `<div class="character-track-empty muted">Трек не добавлен</div>`
      }

      ${
        readOnly
          ? ""
          : `
            <div class="inline-track-edit-row">
              <input
                id="inlineCharacterTrackFile"
                class="inline-hidden-file-input"
                type="file"
                accept=".mp3,.wav,.ogg,audio/*"
              />

              <label
                for="inlineCharacterTrackFile"
                class="compact-inline-upload-btn compact-inline-upload-btn--track"
                aria-label="Загрузить новый трек"
                title="Загрузить новый трек"
              >
                <span class="compact-inline-upload-btn__text">Заменить трек</span>
                <span class="compact-inline-upload-btn__icon">⤴</span>
              </label>
            </div>
          `
      }
    </div>
  `;
}

function renderWorldsInline(worldNames = []) {
  if (!Array.isArray(worldNames) || !worldNames.length) {
    return `
      <div class="compact-character-worlds-inline">
        <span class="compact-character-worlds-label">Миры:</span>
        <span class="compact-character-worlds-empty muted">не указаны</span>
      </div>
    `;
  }

  return `
    <div class="compact-character-worlds-inline">
      <span class="compact-character-worlds-label">Миры:</span>

      <div class="compact-character-worlds-tags">
        ${worldNames.map((world) => `
          <span class="character-world-chip">${escapeHtml(world)}</span>
        `).join("")}
      </div>
    </div>
  `;
}

function renderCharacterAchievements(character, characterAchievements = []) {
  if (!characterAchievements.length) {
    return `
      <div class="character-achievements-block character-achievements-block--compact">
        <div class="character-achievements-head">
          <div class="character-section-label">Достижения персонажа</div>
        </div>

        <div class="compact-empty-strip compact-empty-strip--sm">
          У этого персонажа пока нет достижений
        </div>
      </div>
    `;
  }

  const itemsHtml = characterAchievements.map((item) => {
    const imageUrl = escapeHtml(item.image_url || DEFAULT_ACHIEVEMENT_IMAGE);
    const title = escapeHtml(item.title || "Достижение");

    return `
      <button
        class="character-achievement-orb-btn character-achievement-orb-btn--compact"
        type="button"
        data-image="${encodeURIComponent(item.image_url || DEFAULT_ACHIEVEMENT_IMAGE)}"
        data-title="${encodeURIComponent(item.title || "Достижение")}"
        data-character="${encodeURIComponent(character.name || "Персонаж")}"
        data-player=""
        data-description="${encodeURIComponent(item.description || "Описание не указано")}"
        title="${title}"
      >
        <div
          class="character-achievement-orb-image character-achievement-orb-image--round"
          style="background-image:url('${imageUrl}')"
        ></div>

        <div class="character-achievement-orb-title character-achievement-orb-title--compact">
          ${title}
        </div>
      </button>
    `;
  }).join("");

  return `
    <div class="character-achievements-block character-achievements-block--compact">
      <div class="character-achievements-head">
        <div class="character-section-label">Достижения персонажа</div>

        <div class="character-achievements-slider-head">
          <button
            id="characterAchievementsPrevBtn"
            class="slider-arrow-btn"
            type="button"
            aria-label="Назад"
            title="Назад"
          >‹</button>

          <button
            id="characterAchievementsNextBtn"
            class="slider-arrow-btn"
            type="button"
            aria-label="Вперёд"
            title="Вперёд"
          >›</button>
        </div>
      </div>

      <div
        id="characterAchievementsTrack"
        class="character-achievements-orb-track character-achievements-orb-track--compact"
      >
        ${itemsHtml}
      </div>
    </div>
  `;
}

function renderEditableName(character, readOnly = false) {
  const name = character.name || "Без имени";

  if (readOnly) {
    return `<h2 class="compact-character-sheet-title">${escapeHtml(name)}</h2>`;
  }

  return `
    <div class="inline-edit-field inline-edit-field--title">
      <div class="inline-static-value inline-static-value--title">
        ${escapeHtml(name)}
      </div>

      <input
        id="inlineCharacterName"
        class="inline-edit-input inline-edit-input--title"
        type="text"
        value="${escapeHtml(character.name || "")}"
        placeholder="Имя персонажа"
      />
    </div>
  `;
}

function renderEditableMetaField({
  id,
  value,
  placeholder,
  readOnly = false
}) {
  const safeValue = value || placeholder;

  if (readOnly) {
    return `
      <span class="compact-character-main-meta-item">
        ${escapeHtml(safeValue)}
      </span>
    `;
  }

  return `
    <span class="inline-meta-field">
      <span class="inline-static-value inline-static-value--meta">
        ${escapeHtml(safeValue)}
      </span>

      <input
        id="${id}"
        class="inline-edit-input inline-edit-input--meta"
        type="text"
        value="${escapeHtml(value || "")}"
        placeholder="${escapeHtml(placeholder)}"
      />
    </span>
  `;
}

function renderEditableDescription(character, readOnly = false) {
  const safeText = cleanDisplayText(character.description || "Описание пока не добавлено.");

  if (readOnly) {
    return `<div class="compact-character-description-text">${safeText}</div>`;
  }

  return `
    <div class="inline-description-wrap">
      <div class="inline-static-value inline-static-value--description">
        ${safeText}
      </div>

      <textarea
        id="inlineCharacterDescription"
        class="inline-edit-textarea"
        rows="7"
        placeholder="Добавь описание персонажа"
      >${escapeHtml(character.description || "")}</textarea>
    </div>
  `;
}

function renderAvatarBlock(character, readOnly = false) {
  const avatarUrl = escapeHtml(character.avatar_url || DEFAULT_CHARACTER_AVATAR);

  return `
    <div class="compact-character-avatar-card">
      <img
        id="inlineCharacterAvatarPreview"
        class="compact-character-sheet-avatar"
        src="${avatarUrl}"
        alt="avatar"
      />

      ${
        readOnly
          ? ""
          : `
            <input
              id="inlineCharacterAvatarFile"
              class="inline-hidden-file-input"
              type="file"
              accept="image/*"
            />

            <button
              id="inlineCharacterAvatarPickBtn"
              class="compact-inline-upload-btn compact-avatar-edit-btn"
              type="button"
              aria-label="Загрузить новое фото"
              title="Загрузить новое фото"
            >
              <span class="compact-inline-upload-btn__text">Сменить фото</span>
              <span class="compact-inline-upload-btn__icon">⤴</span>
            </button>
          `
      }
    </div>
  `;
}

export function renderCharacterViewModalContent(
  character,
  characterAchievements,
  options = {}
) {
  const {
    readOnly = false,
    ownerLabel = "",
    worldNames = []
  } = options;

  return `
    <div
      id="characterInlineSheet"
      class="compact-character-sheet compact-character-sheet-v4 ${readOnly ? "is-readonly" : ""}"
    >
      <div class="compact-character-sheet-main-grid">
        <div class="compact-character-sheet-left">
          ${renderAvatarBlock(character, readOnly)}
          ${renderTrackBlock(character, readOnly)}
        </div>

        <div class="compact-character-sheet-right">
          <div class="compact-character-header-row compact-character-header-row--tight">
            <div class="compact-character-heading">
              ${renderEditableName(character, readOnly)}

              <div class="compact-character-main-meta">
                ${renderEditableMetaField({
                  id: "inlineCharacterRace",
                  value: character.race || "",
                  placeholder: "Раса не указана",
                  readOnly
                })}

                <span class="compact-character-main-meta-dot">•</span>

                ${renderEditableMetaField({
                  id: "inlineCharacterClass",
                  value: character.class_name || "",
                  placeholder: "Класс не указан",
                  readOnly
                })}
              </div>

              ${
                ownerLabel
                  ? `<div class="compact-character-sheet-owner muted">${escapeHtml(ownerLabel)}</div>`
                  : ""
              }
            </div>
          </div>

          ${renderWorldsInline(worldNames)}

          <div class="compact-character-description-box compact-character-description-box--aligned">
            <div class="character-section-label">Описание</div>
            ${renderEditableDescription(character, readOnly)}
          </div>
        </div>
      </div>

      ${renderCharacterAchievements(character, characterAchievements)}
    </div>
  `;
}