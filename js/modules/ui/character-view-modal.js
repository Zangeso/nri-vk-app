import { escapeHtml, formatDate, cleanDisplayText } from '../utils.js';

const DEFAULT_CHARACTER_AVATAR = "https://placehold.co/400x400?text=Hero";
const DEFAULT_ACHIEVEMENT_IMAGE = "https://placehold.co/500x500?text=Achievement";

function renderCharacterAchievements(character, characterAchievements) {
  if (!characterAchievements.length) {
    return '<div class="compact-empty-strip">У этого персонажа пока нет достижений</div>';
  }

  const itemsHtml = characterAchievements.map((item) => {
    const imageUrl = escapeHtml(item.image_url || DEFAULT_ACHIEVEMENT_IMAGE);
    const title = escapeHtml(item.title || "Достижение");
    const sessionTitle = escapeHtml(item.sessions?.title || "Без сессии");
    const sessionDate = item.sessions?.session_date
      ? ` • ${escapeHtml(formatDate(item.sessions.session_date))}`
      : "";

    return `
      <button
        class="character-achievement-orb-btn compact-modal-achievement-row"
        type="button"
        data-image="${encodeURIComponent(item.image_url || DEFAULT_ACHIEVEMENT_IMAGE)}"
        data-title="${encodeURIComponent(item.title || "Достижение")}"
        data-character="${encodeURIComponent(character.name || "Персонаж")}"
        data-player=""
        data-description="${encodeURIComponent(item.description || "Описание не указано")}"
      >
        <div
          class="character-achievement-orb-image compact-modal-achievement-image"
          style="background-image:url('${imageUrl}')"
        ></div>

        <div class="compact-modal-achievement-body">
          <div class="compact-modal-achievement-title">${title}</div>
          <div class="compact-modal-achievement-meta">${sessionTitle}${sessionDate}</div>
        </div>
      </button>
    `;
  }).join("");

  return `
    <div class="compact-modal-achievements-list">
      ${itemsHtml}
    </div>
  `;
}

function renderTrackBlock(character) {
  if (!character.track_url) {
    return `<p class="muted compact-muted-text">Трек не добавлен</p>`;
  }

  return `
    <audio class="character-audio-player compact-character-audio" controls preload="none">
      <source src="${escapeHtml(character.track_url)}" />
    </audio>
  `;
}

export function renderCharacterViewModalContent(character, characterAchievements, options = {}) {
  const {
    readOnly = false,
    ownerLabel = ""
  } = options;

  const characterAchievementsHtml = renderCharacterAchievements(character, characterAchievements);

  return `
    <div class="compact-character-sheet">
      <div class="compact-character-top">
        <img
          class="compact-character-sheet-avatar"
          src="${escapeHtml(character.avatar_url || DEFAULT_CHARACTER_AVATAR)}"
          alt="avatar"
        />

        <div class="compact-character-sheet-main">
          <div class="compact-character-sheet-head">
            <div class="compact-character-sheet-title-wrap">
              <h2 class="compact-character-sheet-title">${escapeHtml(character.name || "Без имени")}</h2>
              <p class="compact-character-sheet-meta">
                ${escapeHtml(character.race || "Без расы")} • ${escapeHtml(character.class_name || "Без класса")}
              </p>
              ${ownerLabel ? `<p class="compact-character-sheet-owner">${escapeHtml(ownerLabel)}</p>` : ""}
            </div>

            ${readOnly
              ? ""
              : `
                <div class="compact-character-sheet-actions">
                  <button id="openInlineEditBtn" class="icon-only-button" type="button" title="Редактировать">✏</button>
                  <button id="openInlineDeleteBtn" class="icon-only-button danger-icon-button" type="button" title="Удалить">🗑</button>
                </div>
              `
            }
          </div>

          <div class="compact-character-grid">
            <div class="compact-character-section">
              <h4>Описание</h4>
              <p>${cleanDisplayText(character.description || "Без описания")}</p>
            </div>

            <div class="compact-character-section">
              <h4>Личный трек</h4>
              ${renderTrackBlock(character)}
            </div>
          </div>
        </div>
      </div>

      <div class="compact-character-section">
        <h4>Достижения персонажа</h4>
        ${characterAchievementsHtml}
      </div>
    </div>

    ${readOnly
      ? ""
      : `
        <div id="characterInlineEditBlock" class="hidden inline-edit-block compact-inline-edit-block">
          <div class="form-grid compact-form-grid">
            <div>
              <label for="inlineCharacterName">Имя персонажа</label>
              <input id="inlineCharacterName" type="text" value="${escapeHtml(character.name || "")}" />
            </div>

            <div>
              <label for="inlineCharacterRace">Раса</label>
              <input id="inlineCharacterRace" type="text" value="${escapeHtml(character.race || "")}" />
            </div>

            <div>
              <label for="inlineCharacterClass">Класс</label>
              <input id="inlineCharacterClass" type="text" value="${escapeHtml(character.class_name || "")}" />
            </div>

            <div>
              <label for="inlineCharacterTrackFile">Заменить трек</label>
              <input id="inlineCharacterTrackFile" type="file" accept=".mp3,.wav,.ogg,audio/*" />
            </div>
          </div>

          <div>
            <label for="inlineCharacterDescription">Описание</label>
            <textarea id="inlineCharacterDescription" rows="4">${escapeHtml(character.description || "")}</textarea>
          </div>

          <div class="modal-actions top-space compact-inline-edit-actions">
            <button id="cancelInlineEditBtn" class="ghost-button" type="button">Отмена</button>
            <button id="saveInlineEditBtn" type="button">Сохранить</button>
          </div>
        </div>
      `
    }
  `;
}