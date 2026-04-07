import { showToast } from '../../toast.js';
import { openModal, closeModal } from '../../ui/modal.js';
import { escapeHtml, formatDate, cleanDisplayText, truncateText } from '../../utils.js';

import {
  getSessions,
  getSessionById,
  getSessionEntries,
  saveSessionWithParticipants,
  deleteSession
} from '../../services/session.service.js';

import { getCampaignsByWorld } from '../../services/world.service.js';

import {
  getAdminParticipants,
  setAdminParticipants,
  resetAdminParticipants,
  ensureEditParticipantBindings,
  renderParticipantChips
} from '../admin-participants/admin-participants.screen.js';

let sessionCoverCropper = null;
let activeCoverCropContext = 'create';

const editorState = {
  create: {
    sessionId: null,
    coverBlob: null,
    coverPreviewUrl: ''
  },
  edit: {
    sessionId: null,
    coverBlob: null,
    coverPreviewUrl: ''
  }
};

const publishedSessionFilters = {
  from: '',
  to: ''
};

function $(id) {
  return document.getElementById(id);
}

function getEditorConfig(context = 'create') {
  if (context === 'edit') {
    return {
      dateId: 'editSessionDate',
      worldId: 'editSessionWorld',
      campaignId: 'editSessionCampaign',
      titleId: 'editSessionTitle',
      recapId: 'editSessionRecapLink',
      resultId: 'editSessionResultText',
      trackId: 'editSessionTrackFile',
      coverFileId: 'editSessionCoverFile',
      coverPreviewId: 'editSessionCoverPreview',
      removeCoverBtnId: 'removeEditSessionCoverBtn',
      participantsId: 'editSessionParticipantChips',
      publishBtnId: 'saveSessionEditBtn'
    };
  }

  return {
    dateId: 'sessionDate',
    worldId: 'sessionWorld',
    campaignId: 'sessionCampaign',
    titleId: 'sessionTitle',
    recapId: 'sessionRecapLink',
    resultId: 'sessionResultText',
    trackId: 'sessionTrackFile',
    coverFileId: 'sessionCoverFile',
    coverPreviewId: 'sessionCoverPreview',
    removeCoverBtnId: 'removeSessionCoverBtn',
    participantsId: 'sessionParticipantChips',
    publishBtnId: 'publishSessionBtn'
  };
}

function getState(context = 'create') {
  return editorState[context] || editorState.create;
}

function readPublishedSessionFilters() {
  publishedSessionFilters.from = $('publishedSessionsDateFrom')?.value || '';
  publishedSessionFilters.to = $('publishedSessionsDateTo')?.value || '';
}

function getSessionTimeForFilter(session) {
  if (!session?.session_date) return null;

  const date = new Date(`${session.session_date}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  return date.getTime();
}

function filterPublishedSessions(sessions = []) {
  const fromValue = publishedSessionFilters.from;
  const toValue = publishedSessionFilters.to;

  if (!fromValue && !toValue) {
    return sessions;
  }

  const fromTime = fromValue
    ? new Date(`${fromValue}T00:00:00`).getTime()
    : null;

  const toTime = toValue
    ? new Date(`${toValue}T23:59:59`).getTime()
    : null;

  return sessions.filter((session) => {
    const sessionTime = getSessionTimeForFilter(session);
    if (sessionTime === null) return false;

    if (fromTime !== null && sessionTime < fromTime) return false;
    if (toTime !== null && sessionTime > toTime) return false;

    return true;
  });
}

function bindPublishedSessionFilterControls() {
  const fromInput = $('publishedSessionsDateFrom');
  const toInput = $('publishedSessionsDateTo');
  const clearBtn = $('clearPublishedSessionsFilterBtn');

  if (fromInput && fromInput.dataset.bound !== '1') {
    fromInput.addEventListener('change', async () => {
      readPublishedSessionFilters();
      await renderPublishedSessionsAdmin();
    });
    fromInput.dataset.bound = '1';
  }

  if (toInput && toInput.dataset.bound !== '1') {
    toInput.addEventListener('change', async () => {
      readPublishedSessionFilters();
      await renderPublishedSessionsAdmin();
    });
    toInput.dataset.bound = '1';
  }

  if (clearBtn && clearBtn.dataset.bound !== '1') {
    clearBtn.addEventListener('click', async () => {
      if (fromInput) fromInput.value = '';
      if (toInput) toInput.value = '';
      readPublishedSessionFilters();
      await renderPublishedSessionsAdmin();
    });
    clearBtn.dataset.bound = '1';
  }
}

function renderSessionCoverPreview(context = 'create', previewUrl = '') {
  const config = getEditorConfig(context);
  const preview = $(config.coverPreviewId);
  const removeBtn = $(config.removeCoverBtnId);

  if (!preview) return;

  if (previewUrl) {
    preview.innerHTML =
      `<img src="${escapeHtml(previewUrl)}" class="preview-session-cover" alt="preview" />`;
    preview.classList.remove('empty');
    removeBtn?.classList.remove('hidden');
    return;
  }

  preview.innerHTML = 'Изображение ещё не выбрано';
  preview.classList.add('empty');
  removeBtn?.classList.add('hidden');
}

function removeSessionCover(context = 'create') {
  const state = getState(context);
  const config = getEditorConfig(context);

  state.coverBlob = null;
  state.coverPreviewUrl = '';

  if ($(config.coverFileId)) {
    $(config.coverFileId).value = '';
  }

  renderSessionCoverPreview(context, '');
}

function openSessionCoverCropModal(imageSrc, context = 'create') {
  activeCoverCropContext = context;
  if (!$('sessionCoverCropImage')) return;

  $('sessionCoverCropImage').src = imageSrc;
  openModal('sessionCoverCropModal');

  if (sessionCoverCropper) {
    sessionCoverCropper.destroy();
  }

  sessionCoverCropper = new Cropper($('sessionCoverCropImage'), {
    aspectRatio: 16 / 9,
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 1,
    responsive: true,
    background: false
  });
}

function closeSessionCoverCropModal() {
  closeModal('sessionCoverCropModal');

  if (sessionCoverCropper) {
    sessionCoverCropper.destroy();
    sessionCoverCropper = null;
  }
}

async function applySessionCoverCrop() {
  if (!sessionCoverCropper) return;

  const canvas = sessionCoverCropper.getCroppedCanvas({ width: 1280, height: 720 });

  if (!canvas) {
    showToast('Не удалось обрезать изображение', 'error');
    return;
  }

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.88);
  });

  if (!blob) {
    showToast('Не удалось подготовить изображение', 'error');
    return;
  }

  const state = getState(activeCoverCropContext);
  state.coverBlob = blob;
  state.coverPreviewUrl = URL.createObjectURL(blob);

  renderSessionCoverPreview(activeCoverCropContext, state.coverPreviewUrl);
  closeSessionCoverCropModal();
}

async function fillCampaignSelect(selectId, worldId = null, selectedCampaignId = null) {
  const select = $(selectId);
  if (!select) return;

  if (!worldId) {
    select.innerHTML = `<option value="">Ваншот</option>`;
    select.value = '';
    return;
  }

  try {
    const campaigns = await getCampaignsByWorld(worldId);

    select.innerHTML = `
      <option value="">Ваншот</option>
      ${(campaigns || []).map((campaign) => `
        <option value="${campaign.id}">${escapeHtml(campaign.title || 'Кампания')}</option>
      `).join('')}
    `;

    select.value = selectedCampaignId || '';
  } catch (error) {
    select.innerHTML = `<option value="">Ваншот</option>`;
    select.value = '';
    showToast('Ошибка загрузки кампаний: ' + error.message, 'error');
  }
}

function readSessionEditorData(context = 'create') {
  const config = getEditorConfig(context);
  const state = getState(context);

  return {
    sessionId: state.sessionId || null,
    date: $(config.dateId)?.value || '',
    worldId: $(config.worldId)?.value || null,
    campaignId: $(config.campaignId)?.value || null,
    title: $(config.titleId)?.value.trim() || '',
    recapLink: $(config.recapId)?.value.trim() || '',
    resultText: $(config.resultId)?.value.trim() || '',
    trackFile: $(config.trackId)?.files?.[0] || null,
    coverBlob: state.coverBlob || null
  };
}

function validateSessionEditor(context = 'create') {
  const data = readSessionEditorData(context);
  const participants = getAdminParticipants(context);

  if (!data.date) {
    showToast('Укажи дату сессии', 'error');
    return false;
  }

  if (!data.worldId) {
    showToast('Выбери мир', 'error');
    return false;
  }

  if (!data.title) {
    showToast('Укажи название записи', 'error');
    return false;
  }

  if (!participants.length) {
    showToast('Добавь хотя бы одного участника', 'error');
    return false;
  }

  return true;
}

function resetSessionEditor(context = 'create') {
  const config = getEditorConfig(context);
  const state = getState(context);

  state.sessionId = null;
  state.coverBlob = null;
  state.coverPreviewUrl = '';

  $(config.dateId) && ($(config.dateId).value = '');
  $(config.worldId) && ($(config.worldId).value = '');
  $(config.campaignId) && ($(config.campaignId).innerHTML = `<option value="">Ваншот</option>`);
  $(config.titleId) && ($(config.titleId).value = '');
  $(config.recapId) && ($(config.recapId).value = '');
  $(config.trackId) && ($(config.trackId).value = '');
  $(config.resultId) && ($(config.resultId).value = '');
  $(config.coverFileId) && ($(config.coverFileId).value = '');

  renderSessionCoverPreview(context, '');
  resetAdminParticipants(context);

  if (context === 'create' && $(config.publishBtnId)) {
    $(config.publishBtnId).textContent = 'Опубликовать сессию';
  }
}

function cloneWorldOptionsToEditModal() {
  const source = $('sessionWorld');
  const target = $('editSessionWorld');

  if (!source || !target) return;
  target.innerHTML = source.innerHTML;
}

function renderEditSessionModalContent() {
  return `
    <div class="admin-edit-session-form">
      <div class="admin-edit-session-grid">
        <div>
          <label for="editSessionDate">Дата</label>
          <input id="editSessionDate" type="date" />
        </div>

        <div>
          <label for="editSessionWorld">Мир</label>
          <select id="editSessionWorld">
            <option value="">Выберите мир</option>
          </select>
        </div>

        <div>
          <label for="editSessionCampaign">Кампания</label>
          <select id="editSessionCampaign">
            <option value="">Ваншот</option>
          </select>
        </div>

        <div>
          <label for="editSessionTitle">Название</label>
          <input id="editSessionTitle" type="text" placeholder="Название сессии" />
        </div>
      </div>

      <div class="admin-edit-session-split">
        <div class="admin-edit-session-result">
          <label for="editSessionResultText">Итог</label>
          <textarea id="editSessionResultText" rows="3"></textarea>
        </div>

        <div class="admin-edit-session-participants">
          <div class="admin-session-participants-head">
            <span>Участники</span>
            <button id="openEditParticipantEditorBtn" class="section-action-btn" type="button">+</button>
          </div>

          <div id="editSessionParticipantChips" class="chips-wrap"></div>
        </div>
      </div>

      <div class="admin-edit-session-grid admin-edit-session-grid--materials">
  <div class="admin-session-materials-layout">
    <div class="admin-session-cover">
      <label>Обложка</label>

      <div class="admin-cover-box">
        <div id="editSessionCoverPreview" class="admin-cover-preview empty">
          Нет изображения
        </div>

        <button
          id="removeEditSessionCoverBtn"
          class="admin-cover-remove hidden"
          type="button"
        >✕</button>
      </div>
    </div>

    <div class="admin-session-materials-side">
      <div class="admin-session-materials-actions">
        <label class="admin-compact-upload-btn" for="editSessionCoverFile">Выбрать обложку</label>
        <input id="editSessionCoverFile" type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/*" />

        <label class="admin-compact-upload-btn" for="editSessionTrackFile">Выбрать трек</label>
        <input id="editSessionTrackFile" type="file" accept=".mp3,.wav,.ogg,audio/*" />
      </div>

      <div class="admin-session-materials-link">
        <label for="editSessionRecapLink">Ссылка на пересказ</label>
        <input id="editSessionRecapLink" type="text" />
      </div>
    </div>
  </div>
</div>
  `;
}

async function bindEditSessionModal(session, entries) {
  $('sessionEditContainer').innerHTML = renderEditSessionModalContent();

  cloneWorldOptionsToEditModal();

  const editState = getState('edit');
  editState.sessionId = session.id;
  editState.coverBlob = null;
  editState.coverPreviewUrl = session.cover_url || '';

  $('editSessionDate').value = session.session_date || '';
  $('editSessionWorld').value = session.world_id || '';
  await fillCampaignSelect('editSessionCampaign', session.world_id || null, session.campaign_id || '');
  $('editSessionTitle').value = session.title || '';
  $('editSessionRecapLink').value = session.recap_link || '';
  $('editSessionResultText').value = session.short_story || '';
  $('editSessionTrackFile').value = '';
  $('editSessionCoverFile').value = '';

  renderSessionCoverPreview('edit', editState.coverPreviewUrl);

  const participantsFromEntries = (entries || []).map((entry) => ({
    characterId: entry.character_id,
    characterName: entry.characters?.name || 'Персонаж',
    playerName: entry.characters?.players?.nickname || 'Игрок',
    achievementTitle: entry.achievement_title || '',
    achievementDescription: entry.achievement_description || '',
    croppedImageBlob: null,
    imagePreviewUrl: entry.achievement_image_url || ''
  }));

  setAdminParticipants(participantsFromEntries, 'edit');
  ensureEditParticipantBindings();

  $('editSessionWorld')?.addEventListener('change', async () => {
    await fillCampaignSelect('editSessionCampaign', $('editSessionWorld').value || null, '');
  });

  $('editSessionCoverFile')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Выбери изображение', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => openSessionCoverCropModal(event.target.result, 'edit');
    reader.readAsDataURL(file);
  });

  $('removeEditSessionCoverBtn')?.addEventListener('click', () => removeSessionCover('edit'));
}

async function openEditSessionModal(sessionId) {
  try {
    const session = await getSessionById(sessionId);
    const entries = await getSessionEntries(sessionId);

    await bindEditSessionModal(session, entries);
    openModal('sessionEditModal');
  } catch (error) {
    showToast('Ошибка загрузки сессии: ' + error.message, 'error');
  }
}

function closeEditSessionModal() {
  resetSessionEditor('edit');
  $('sessionEditContainer') && ($('sessionEditContainer').innerHTML = '');
  closeModal('sessionEditModal');
}

async function saveEditSession() {
  if (!validateSessionEditor('edit')) return;

  const data = readSessionEditorData('edit');
  const participants = getAdminParticipants('edit');

  try {
    await saveSessionWithParticipants(data.sessionId, data, participants);
    closeEditSessionModal();
    await renderPublishedSessionsAdmin();
    showToast('Сессия обновлена', 'success');
  } catch (error) {
    showToast('Ошибка сохранения: ' + (error?.message || 'неизвестная ошибка'), 'error');
  }
}

async function publishSession() {
  if (!validateSessionEditor('create')) return;

  const data = readSessionEditorData('create');
  const participants = getAdminParticipants('create');

  try {
    await saveSessionWithParticipants(null, data, participants);
    resetSessionEditor('create');
    await renderPublishedSessionsAdmin();
    showToast('Сессия опубликована', 'success');
  } catch (error) {
    showToast('Ошибка публикации: ' + (error?.message || 'неизвестная ошибка'), 'error');
  }
}

async function deleteSessionHandler(sessionId) {
  if (!confirm('Удалить эту публикацию сессии и все связанные достижения?')) return;

  try {
    await deleteSession(sessionId);
    await renderPublishedSessionsAdmin();
    showToast('Публикация удалена', 'success');
  } catch (error) {
    showToast('Ошибка удаления: ' + error.message, 'error');
  }
}

function renderPublishedSessionCard(session) {
  const worldTitle = session.worlds?.title || 'Мир не указан';
  const campaignTitle = session.campaigns?.title || 'Ваншот';
  const story = truncateText(cleanDisplayText(session.short_story || 'Краткое описание пока не добавлено.'), 180);

  return `
    <div class="compact-session-admin-card">
      <div class="compact-session-admin-top">
        <div>
          <h4>${escapeHtml(session.title || 'Сессия')}</h4>
          <p class="muted small-text">
            ${escapeHtml(formatDate(session.session_date) || '—')}
            • ${escapeHtml(worldTitle)}
            • ${escapeHtml(campaignTitle)}
          </p>
        </div>

        <div class="compact-session-admin-actions">
          <button
            class="icon-only-button edit-session-btn"
            type="button"
            data-session-id="${session.id}"
            title="Редактировать"
            aria-label="Редактировать"
          >✏</button>

          <button
            class="danger-action-icon-btn delete-session-btn"
            type="button"
            data-session-id="${session.id}"
            title="Удалить"
            aria-label="Удалить"
          >🗑</button>
        </div>
      </div>

      <p>${story}</p>
    </div>
  `;
}

function bindPublishedSessionActions() {
  document.querySelectorAll('.edit-session-btn').forEach((button) => {
    button.addEventListener('click', () => {
      openEditSessionModal(button.dataset.sessionId);
    });
  });

  document.querySelectorAll('.delete-session-btn').forEach((button) => {
    button.addEventListener('click', () => {
      deleteSessionHandler(button.dataset.sessionId);
    });
  });
}

export async function renderPublishedSessionsAdmin() {
  if (!$('publishedSessionsList')) return;

  try {
    readPublishedSessionFilters();

    const sessions = await getSessions();
    const filteredSessions = filterPublishedSessions(sessions || []);

    if (!sessions.length) {
      $('publishedSessionsList').innerHTML =
        `<div class="card-item">Пока нет опубликованных сессий.</div>`;
      return;
    }

    if (!filteredSessions.length) {
      $('publishedSessionsList').innerHTML =
        `<div class="card-item">Ничего не найдено по выбранному диапазону.</div>`;
      return;
    }

    $('publishedSessionsList').innerHTML = filteredSessions
      .map((session) => renderPublishedSessionCard(session))
      .join('');

    bindPublishedSessionActions();
  } catch (error) {
    $('publishedSessionsList').innerHTML =
      `<div class="card-item">Ошибка загрузки: ${escapeHtml(error.message || 'неизвестная ошибка')}</div>`;
  }
}

export function initAdminSessionsScreen() {
  $('sessionCoverFile')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Выбери изображение', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => openSessionCoverCropModal(event.target.result, 'create');
    reader.readAsDataURL(file);
  });

  $('closeSessionCoverCropModalBtn')?.addEventListener('click', closeSessionCoverCropModal);
  $('applySessionCoverCropBtn')?.addEventListener('click', applySessionCoverCrop);

  $('removeSessionCoverBtn')?.addEventListener('click', () => removeSessionCover('create'));
  $('publishSessionBtn')?.addEventListener('click', publishSession);
  $('resetSessionEditorBtn')?.addEventListener('click', () => resetSessionEditor('create'));

  $('closeSessionEditModalBtn')?.addEventListener('click', closeEditSessionModal);
  $('saveSessionEditBtn')?.addEventListener('click', saveEditSession);

  bindPublishedSessionFilterControls();

  $('sessionWorld')?.addEventListener('change', async () => {
    await fillCampaignSelect('sessionCampaign', $('sessionWorld').value || null, '');
  });

  renderSessionCoverPreview('create', '');
  renderParticipantChips('create');
}