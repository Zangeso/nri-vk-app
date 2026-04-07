import { supabase } from '../../supabase.js';
import { showToast } from '../../toast.js';
import { openModal, closeModal } from '../../ui/modal.js';
import { escapeHtml, cleanDisplayText } from '../../utils.js';

const PARTICIPANT_CONTEXTS = {
  create: {
    triggerId: 'openParticipantEditorBtn',
    chipsId: 'sessionParticipantChips'
  },
  edit: {
    triggerId: 'openEditParticipantEditorBtn',
    chipsId: 'editSessionParticipantChips'
  }
};

let participantContexts = {
  create: [],
  edit: []
};

let activeParticipantContext = 'create';
let editingParticipantIndex = null;

let achievementCropper = null;
let currentParticipantBlob = null;
let currentParticipantPreviewUrl = '';
let selectedCharacterId = null;

function $(id) {
  return document.getElementById(id);
}

function getContextConfig(context = activeParticipantContext) {
  return PARTICIPANT_CONTEXTS[context] || PARTICIPANT_CONTEXTS.create;
}

function ensureContext(context = 'create') {
  if (!Array.isArray(participantContexts[context])) {
    participantContexts[context] = [];
  }
  return participantContexts[context];
}

function getContextParticipants(context = activeParticipantContext) {
  return ensureContext(context);
}

function setActiveParticipantContext(context = 'create') {
  activeParticipantContext = PARTICIPANT_CONTEXTS[context] ? context : 'create';
}

function renderParticipantAchievementPreview(previewUrl = '') {
  if (!$('participantAchievementImagePreview')) return;

  if (previewUrl) {
    $('participantAchievementImagePreview').innerHTML =
      `<img src="${previewUrl}" class="preview-square preview-small-square" alt="preview" />`;
    $('participantAchievementImagePreview').classList.remove('empty');
    return;
  }

  $('participantAchievementImagePreview').innerHTML = 'Изображение достижения ещё не выбрано';
  $('participantAchievementImagePreview').classList.add('empty');
}

function removeParticipantAchievementImage() {
  currentParticipantBlob = null;
  currentParticipantPreviewUrl = '';

  if ($('participantAchievementImageFile')) {
    $('participantAchievementImageFile').value = '';
  }

  renderParticipantAchievementPreview('');
}

async function fetchCharactersForAdminOptions() {
  const { data, error } = await supabase
    .from('characters')
    .select(`
      id,
      name,
      race,
      class_name,
      players(nickname)
    `)
    .order('name', { ascending: true });

  if (error) return [];
  return data || [];
}

function renderCharacterSearchResults(options, filterText = '') {
  const results = $('participantCharacterResults');
  if (!results) return;

  const normalized = String(filterText || '').trim().toLowerCase();

  const filtered = !normalized
    ? options
    : options.filter((char) => {
        const characterName = String(char.name || '').toLowerCase();
        const playerName = String(char.players?.nickname || '').toLowerCase();
        return characterName.includes(normalized) || playerName.includes(normalized);
      });

  if (!filtered.length) {
    results.innerHTML = `<div class="muted small-text">Ничего не найдено</div>`;
    return;
  }

  results.innerHTML = filtered.map((char) => `
    <button
      class="card-item"
      type="button"
      data-character-id="${char.id}"
      data-character-name="${escapeHtml(char.name || 'Персонаж')}"
      data-player-name="${escapeHtml(char.players?.nickname || 'Игрок')}"
      style="width:100%; text-align:left;"
    >
      <div><strong>${escapeHtml(char.name || 'Персонаж')}</strong></div>
      <div class="muted small-text">
        ${escapeHtml(char.players?.nickname || 'Игрок')}
        ${char.race ? ` • ${escapeHtml(char.race)}` : ''}
        ${char.class_name ? ` • ${escapeHtml(char.class_name)}` : ''}
      </div>
    </button>
  `).join('');

  results.querySelectorAll('[data-character-id]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedCharacterId = button.dataset.characterId || null;

      if ($('participantCharacterSearch')) {
        $('participantCharacterSearch').value = button.dataset.characterName || '';
      }

      if ($('participantPlayerSearch')) {
        $('participantPlayerSearch').value = button.dataset.playerName || '';
      }

      results.innerHTML = '';
    });
  });
}

function fillParticipantFormFromPayload(payload) {
  selectedCharacterId = payload.characterId || null;

  if ($('participantCharacterSearch')) {
    $('participantCharacterSearch').value = payload.characterName || '';
  }

  if ($('participantPlayerSearch')) {
    $('participantPlayerSearch').value = payload.playerName || '';
  }

  if ($('participantAchievementTitle')) {
    $('participantAchievementTitle').value = payload.achievementTitle || '';
  }

  if ($('participantAchievementDescription')) {
    $('participantAchievementDescription').value = payload.achievementDescription || '';
  }

  currentParticipantPreviewUrl = payload.imagePreviewUrl || '';
  currentParticipantBlob = payload.croppedImageBlob || null;

  renderParticipantAchievementPreview(currentParticipantPreviewUrl);
}

function resetParticipantForm() {
  selectedCharacterId = null;
  currentParticipantBlob = null;
  currentParticipantPreviewUrl = '';

  if ($('participantPlayerSearch')) $('participantPlayerSearch').value = '';
  if ($('participantCharacterSearch')) $('participantCharacterSearch').value = '';
  if ($('participantAchievementTitle')) $('participantAchievementTitle').value = '';
  if ($('participantAchievementDescription')) $('participantAchievementDescription').value = '';
  if ($('participantAchievementImageFile')) $('participantAchievementImageFile').value = '';
  if ($('participantCharacterResults')) $('participantCharacterResults').innerHTML = '';

  renderParticipantAchievementPreview('');
}

async function openParticipantModal(index = null, context = activeParticipantContext) {
  setActiveParticipantContext(context);
  editingParticipantIndex = index;

  if ($('participantModalTitle')) {
    $('participantModalTitle').textContent =
      index === null ? 'Участник сессии' : 'Редактировать участника';
  }

  resetParticipantForm();

  const options = await fetchCharactersForAdminOptions();
  const participants = getContextParticipants(activeParticipantContext);

  if (index !== null && participants[index]) {
    fillParticipantFormFromPayload(participants[index]);
  }

  const bindSearch = () => {
    const currentText =
      $('participantCharacterSearch')?.value ||
      $('participantPlayerSearch')?.value ||
      '';
    renderCharacterSearchResults(options, currentText);
  };

  if ($('participantCharacterSearch')) {
    $('participantCharacterSearch').oninput = bindSearch;
    $('participantCharacterSearch').onfocus = bindSearch;
  }

  if ($('participantPlayerSearch')) {
    $('participantPlayerSearch').oninput = bindSearch;
    $('participantPlayerSearch').onfocus = bindSearch;
  }

  openModal('participantModal');
}

function buildParticipantCardHtml(p, idx, context) {
  return `
    <div class="admin-participant-tag">
      <span class="admin-participant-tag__name">
        ${escapeHtml(p.characterName || 'Персонаж')}
      </span>

      <div class="admin-participant-tag__actions">
        <button
          class="admin-participant-tag__btn edit-participant-chip-btn"
          data-index="${idx}"
          data-context="${context}"
          type="button"
          title="Редактировать"
        >✏</button>

        <button
          class="admin-participant-tag__btn remove-participant-chip-btn"
          data-index="${idx}"
          data-context="${context}"
          type="button"
          title="Удалить"
        >✕</button>
      </div>
    </div>
  `;
}

export function renderParticipantChips(context = 'create') {
  const config = getContextConfig(context);
  const target = $(config.chipsId);

  if (!target) return;

  const participants = getContextParticipants(context);

  if (!participants.length) {
    target.innerHTML = `<div class="muted small-text">Участники ещё не добавлены</div>`;
    return;
  }

  target.innerHTML = participants.map((p, idx) => buildParticipantCardHtml(p, idx, context)).join('');

  target.querySelectorAll('.edit-participant-chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      openParticipantModal(Number(btn.dataset.index), btn.dataset.context || context);
    });
  });

  target.querySelectorAll('.remove-participant-chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetContext = btn.dataset.context || context;
      const items = getContextParticipants(targetContext);
      items.splice(Number(btn.dataset.index), 1);
      renderParticipantChips(targetContext);
    });
  });
}

async function saveParticipantFromModal() {
  if (!selectedCharacterId) {
    showToast('Сначала выбери персонажа из списка', 'error');
    return;
  }

  const title = $('participantAchievementTitle')?.value.trim() || '';
  const description = $('participantAchievementDescription')?.value.trim() || '';

  const options = await fetchCharactersForAdminOptions();
  const selected = options.find((c) => c.id === selectedCharacterId);

  if (!selected) {
    showToast('Персонаж не найден', 'error');
    return;
  }

  const payload = {
    characterId: selectedCharacterId,
    characterName: selected?.name || 'Персонаж',
    playerName: selected?.players?.nickname || 'Игрок',
    achievementTitle: title,
    achievementDescription: description,
    croppedImageBlob: currentParticipantBlob,
    imagePreviewUrl: currentParticipantPreviewUrl || ''
  };

  const items = getContextParticipants(activeParticipantContext);

  if (editingParticipantIndex === null) {
    items.push(payload);
  } else {
    items[editingParticipantIndex] = payload;
  }

  closeModal('participantModal');
  renderParticipantChips(activeParticipantContext);
}

function openAchievementCropModal(imageSrc) {
  if (!$('participantAchievementCropImage')) return;

  $('participantAchievementCropImage').src = imageSrc;
  openModal('participantAchievementCropModal');

  if (achievementCropper) {
    achievementCropper.destroy();
  }

  achievementCropper = new Cropper($('participantAchievementCropImage'), {
    aspectRatio: 1,
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 1,
    responsive: true,
    background: false
  });
}

function closeAchievementCropModal() {
  closeModal('participantAchievementCropModal');

  if (achievementCropper) {
    achievementCropper.destroy();
    achievementCropper = null;
  }
}

async function applyAchievementCrop() {
  if (!achievementCropper) return;

  const canvas = achievementCropper.getCroppedCanvas({ width: 700, height: 700 });

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

  currentParticipantBlob = blob;
  currentParticipantPreviewUrl = URL.createObjectURL(blob);

  renderParticipantAchievementPreview(currentParticipantPreviewUrl);
  closeAchievementCropModal();
}

export function getAdminParticipants(context = 'create') {
  return getContextParticipants(context);
}

export function setAdminParticipants(participants = [], context = 'create') {
  participantContexts[context] = Array.isArray(participants) ? participants : [];
  renderParticipantChips(context);
}

export function resetAdminParticipants(context = 'create') {
  participantContexts[context] = [];

  if (activeParticipantContext === context) {
    editingParticipantIndex = null;
    currentParticipantBlob = null;
    currentParticipantPreviewUrl = '';
    selectedCharacterId = null;
  }

  renderParticipantChips(context);
}

export function ensureEditParticipantBindings() {
  const editTrigger = $(PARTICIPANT_CONTEXTS.edit.triggerId);

  if (editTrigger && editTrigger.dataset.bound !== '1') {
    editTrigger.addEventListener('click', () => openParticipantModal(null, 'edit'));
    editTrigger.dataset.bound = '1';
  }

  renderParticipantChips('edit');
}

export function initAdminParticipantsScreen() {
  const createTrigger = $(PARTICIPANT_CONTEXTS.create.triggerId);

  if (createTrigger && createTrigger.dataset.bound !== '1') {
    createTrigger.addEventListener('click', () => openParticipantModal(null, 'create'));
    createTrigger.dataset.bound = '1';
  }

  $('closeParticipantModalBtn')?.addEventListener('click', () => closeModal('participantModal'));
  $('saveParticipantBtn')?.addEventListener('click', saveParticipantFromModal);

  $('participantAchievementImageFile')?.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Выбери изображение', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => openAchievementCropModal(e.target.result);
    reader.readAsDataURL(file);
  });

  $('closeParticipantAchievementCropModalBtn')?.addEventListener('click', closeAchievementCropModal);
  $('applyParticipantAchievementCropBtn')?.addEventListener('click', applyAchievementCrop);
  $('removeParticipantAchievementImageBtn')?.addEventListener('click', removeParticipantAchievementImage);

  renderParticipantChips('create');
}