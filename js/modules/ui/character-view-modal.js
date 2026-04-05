import { escapeHtml, cleanDisplayText } from '../utils.js';

const DEFAULT_CHARACTER_AVATAR = "https://placehold.co/400x400?text=Hero";
const DEFAULT_ACHIEVEMENT_IMAGE = "https://placehold.co/500x500?text=Achievement";

function renderAvatarBlock(character, readOnly = false) {
  const avatarUrl = escapeHtml(character.avatar_url || DEFAULT_CHARACTER_AVATAR);

  return `
    <div class="character-card-hero-media">
      <div class="character-card-avatar-shell">
        <img
          id="inlineCharacterAvatarPreview"
          class="character-card-avatar"
          src="${avatarUrl}"
          alt="avatar"
        />
      </div>

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
              class="character-card-action-chip compact-inline-upload-btn"
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

function renderEditableName(character, readOnly = false) {
  const name = character.name || "Без имени";

  if (readOnly) {
    return `<h2 class="character-card-title">${escapeHtml(name)}</h2>`;
  }

  return `
    <div class="character-card-edit-field character-card-edit-field--title">
      <h2 class="character-card-title inline-static-value inline-static-value--title">${escapeHtml(name)}</h2>

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
    return `<span class="character-card-meta-chip">${escapeHtml(safeValue)}</span>`;
  }

  return `
    <span class="character-card-edit-meta">
      <span class="character-card-meta-chip inline-static-value inline-static-value--meta">
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

function renderWorldsInline(worldNames = []) {
  if (!Array.isArray(worldNames) || !worldNames.length) {
    return `
      <div class="character-card-worlds">
        <div class="character-card-section-kicker">Миры</div>
        <div class="character-card-empty-note">Не указаны</div>
      </div>
    `;
  }

  return `
    <div class="character-card-worlds">
      <div class="character-card-section-kicker">Миры</div>

      <div class="character-card-world-tags">
        ${worldNames.map((world) => `
          <span class="character-card-world-chip">${escapeHtml(world)}</span>
        `).join("")}
      </div>
    </div>
  `;
}

function renderEditableDescription(character, readOnly = false) {
  const safeText = cleanDisplayText(character.description || "Описание пока не добавлено.");

  if (readOnly) {
    return `<div class="character-card-description-text">${safeText}</div>`;
  }

  return `
    <div class="character-card-description-wrap">
      <div class="character-card-description-text inline-static-value inline-static-value--description">${safeText}</div>

      <textarea
        id="inlineCharacterDescription"
        class="inline-edit-textarea"
        rows="7"
        placeholder="Добавь описание персонажа"
      >${escapeHtml(character.description || "")}</textarea>
    </div>
  `;
}

function renderTrackBlock(character, readOnly = false) {
  return `
    <section class="character-card-panel character-card-panel--track">
      <div class="character-card-section-kicker">Личный трек</div>

      <div class="character-card-panel-body">
        ${
          character.track_url
            ? `
              <audio class="character-audio-player compact-character-audio" controls preload="none">
                <source src="${escapeHtml(character.track_url)}" />
              </audio>
            `
            : `<div class="character-card-empty-note">Трек не добавлен</div>`
        }
      </div>

      ${
        readOnly
          ? ""
          : `
            <div class="character-card-panel-actions inline-track-edit-row">
              <input
                id="inlineCharacterTrackFile"
                class="inline-hidden-file-input"
                type="file"
                accept=".mp3,.wav,.ogg,audio/*"
              />

              <label
                for="inlineCharacterTrackFile"
                class="character-card-action-chip compact-inline-upload-btn compact-inline-upload-btn--track"
                aria-label="Загрузить новый трек"
                title="Загрузить новый трек"
              >
                <span class="compact-inline-upload-btn__text">Заменить трек</span>
                <span class="compact-inline-upload-btn__icon">⤴</span>
              </label>
            </div>
          `
      }
    </section>
  `;
}

function renderDescriptionBlock(character, readOnly = false) {
  return `
    <section class="character-card-panel character-card-panel--description">
      <div class="character-card-section-kicker">Описание</div>
      ${renderEditableDescription(character, readOnly)}
    </section>
  `;
}

function renderCharacterAchievements(character, characterAchievements = []) {
  if (!characterAchievements.length) {
    return `
      <section class="character-card-achievements">
        <div class="character-card-achievements-head">
          <div class="character-card-section-kicker">Достижения персонажа</div>
        </div>

        <div class="character-card-empty-note character-card-empty-note--strip">
          У этого персонажа пока нет достижений
        </div>
      </section>
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
    <section class="character-card-achievements">
      <div class="character-card-achievements-head">
        <div class="character-card-section-kicker">Достижения персонажа</div>

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
    </section>
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
      class="character-card-modal ${readOnly ? "is-readonly" : ""}"
    >
      <section class="character-card-top">
        ${renderAvatarBlock(character, readOnly)}

        <div class="character-card-summary">
          ${renderEditableName(character, readOnly)}

          <div class="character-card-meta-row">
            ${renderEditableMetaField({
              id: "inlineCharacterRace",
              value: character.race || "",
              placeholder: "Раса не указана",
              readOnly
            })}

            ${renderEditableMetaField({
              id: "inlineCharacterClass",
              value: character.class_name || "",
              placeholder: "Класс не указан",
              readOnly
            })}
          </div>

          ${
            ownerLabel
              ? `<div class="character-card-owner muted">${escapeHtml(ownerLabel)}</div>`
              : ""
          }

          ${renderWorldsInline(worldNames)}
        </div>
      </section>

      <section class="character-card-middle">
        ${renderTrackBlock(character, readOnly)}
        ${renderDescriptionBlock(character, readOnly)}
      </section>

      ${renderCharacterAchievements(character, characterAchievements)}
    </div>
  `;
}