import { escapeHtml, formatDate, cleanDisplayText } from '../utils.js';

const DEFAULT_CHARACTER_AVATAR = "https://placehold.co/400x400?text=Hero";
const DEFAULT_ACHIEVEMENT_IMAGE = "https://placehold.co/500x500?text=Achievement";

function renderCharacterAchievements(character, characterAchievements) {
  if (!characterAchievements.length) {
    return '<div class="empty-board compact-empty">У этого персонажа пока нет достижений</div>';
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
        class="character-achievement-orb-btn"
        type="button"
        data-image="${encodeURIComponent(item.image_url || DEFAULT_ACHIEVEMENT_IMAGE)}"
        data-title="${encodeURIComponent(item.title || "Достижение")}"
        data-character="${encodeURIComponent(character.name || "Персонаж")}"
        data-player=""
        data-description="${encodeURIComponent(item.description || "Описание не указано")}"
      >
        <div
          class="character-achievement-orb-image"
          style="background-image:url('${imageUrl}')"
        ></div>
        <div class="character-achievement-orb-title">${title}</div>
        <div class="character-achievement-orb-meta">${sessionTitle}${sessionDate}</div>
      </button>
    `;
  }).join("");

  return `
    <div class="character-achievements-slider-head">
      <div class="slider-arrows">
        <button id="characterAchievementsPrevBtn" class="slider-arrow-btn" type="button">‹</button>
        <button id="characterAchievementsNextBtn" class="slider-arrow-btn" type="button">›</button>
      </div>
    </div>

    <div class="character-achievements-board">
      <div id="characterAchievementsTrack" class="character-achievements-orb-track">
        ${itemsHtml}
      </div>
    </div>
  `;
}

export function renderCharacterViewModalContent(character, characterAchievements) {
  const characterAchievementsHtml = renderCharacterAchievements(character, characterAchievements);

  return `
    <div class="character-view-layout">
      <div>
        <img
          class="character-view-avatar"
          src="${escapeHtml(character.avatar_url || DEFAULT_CHARACTER_AVATAR)}"
          alt="avatar"
        />
      </div>

      <div class="character-view-info">
        <div class="character-view-head">
          <div>
            <h2>${escapeHtml(character.name || "Без имени")}</h2>
            <p class="muted">
              ${escapeHtml(character.race || "Без расы")} • ${escapeHtml(character.class_name || "Без класса")}
            </p>
          </div>

          <div class="character-view-actions">
            <button id="openInlineEditBtn" class="icon-only-button" type="button" title="Редактировать">✏</button>
            <button id="openInlineDeleteBtn" class="icon-only-button danger-icon-button" type="button" title="Удалить">🗑</button>
          </div>
        </div>

        <div class="character-view-section">
          <h4>Описание</h4>
          <p>${cleanDisplayText(character.description || "Без описания")}</p>
        </div>

        <div class="character-view-section">
          <h4>Личный трек</h4>
          ${character.track_url
            ? `
              <audio class="character-audio-player" controls preload="none">
                <source src="${escapeHtml(character.track_url)}" />
              </audio>
            `
            : `<p class="muted">Трек не добавлен</p>`
          }
        </div>

        <div class="character-view-section">
          <h4>Достижения персонажа</h4>
          ${characterAchievementsHtml}
        </div>
      </div>
    </div>

    <div id="characterInlineEditBlock" class="hidden inline-edit-block">
      <div class="form-grid">
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
        <textarea id="inlineCharacterDescription" rows="5">${escapeHtml(character.description || "")}</textarea>
      </div>

      <div class="modal-actions top-space">
        <button id="cancelInlineEditBtn" class="ghost-button" type="button">Отмена</button>
        <button id="saveInlineEditBtn" type="button">Сохранить изменения</button>
      </div>
    </div>
  `;
}