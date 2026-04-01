import { initMainTabs } from './modules/ui/tabs.js';
import { showToast } from './modules/toast.js';
import { closeModal } from './modules/ui/modal.js';
import { initCharacterCreateFeature } from './modules/features/character-create/character-create.feature.js';

import {
  resolveAppUser,
  getLocalPlayerId,
  clearLocalPlayer
} from './modules/auth/player-auth.js';

import { openAchievementDetailModal } from './modules/ui/achievement-detail-modal.js';

import {
  renderStoriesScreen
} from './modules/screens/stories/stories.screen.js';

import {
  renderAchievementsScreen
} from './modules/screens/achievements/achievements.screen.js';

import {
  renderCharactersScreen,
  initCharacterDeleteConfirm
} from './modules/screens/characters/characters.screen.js';

import {
  renderPlayerProfileScreen,
  openNicknameModal,
  savePlayerNickname
} from './modules/screens/player-profile/player-profile.screen.js';

function $(id) {
  return document.getElementById(id);
}

async function initVkBridge() {
  if (!window.vkBridge) {
    console.warn('VK Bridge не найден');
    return {
      ok: false,
      launchParams: null,
      userInfo: null
    };
  }

  try {
    await window.vkBridge.send('VKWebAppInit');

    let launchParams = null;
    let userInfo = null;

    try {
      launchParams = window.vkBridge.parseURLSearchParams(window.location.href);
    } catch (e) {
      console.warn('Не удалось прочитать launch params', e);
    }

    try {
      userInfo = await window.vkBridge.send('VKWebAppGetUserInfo');
      console.log('VK user info:', userInfo);
    } catch (e) {
      console.warn('Не удалось получить данные пользователя VK', e);
    }

    return {
      ok: true,
      launchParams,
      userInfo
    };
  } catch (error) {
    console.error('Ошибка инициализации VK Bridge:', error);
    return {
      ok: false,
      launchParams: null,
      userInfo: null
    };
  }
}

async function loadCabinet() {
  let playerId = getLocalPlayerId();

  if (!playerId) {
    const player = await resolveAppUser();
    if (!player) return;
    playerId = player.id;
  }

  const player = await renderPlayerProfileScreen(playerId);
  if (!player) {
    clearLocalPlayer();
    return;
  }

  await renderCharactersScreen({
    playerId,
    onOpenAchievement: openAchievementDetailModal,
    onReloadCabinet: loadCabinet
  });

  await renderAchievementsScreen({
    playerId,
    onOpenAchievement: openAchievementDetailModal
  });

  await renderStoriesScreen({
    playerId,
    onOpenAchievement: openAchievementDetailModal
  });
}

function bindUiActions() {
  $("resetTestPlayerBtn")?.addEventListener("click", async () => {
    clearLocalPlayer();
    localStorage.removeItem("nri_test_external_id");
    localStorage.removeItem("nri_owner_mode");
    localStorage.removeItem("nri_admin_id");
    showToast("Локальный вход сброшен", "success");
    await loadCabinet();
  });

  $("openNicknameModalBtn")?.addEventListener("click", openNicknameModal);
  $("closeNicknameModalBtn")?.addEventListener("click", () => closeModal("nicknameModal"));
  $("saveNicknameBtn")?.addEventListener("click", savePlayerNickname);

  $("closeAchievementDetailModalBtn")?.addEventListener("click", () => closeModal("achievementDetailModal"));
  $("closeCharacterViewModalBtn")?.addEventListener("click", () => closeModal("characterViewModal"));
}

async function init() {
  const appScreen = $("appScreen");

  if (!appScreen) {
    console.error("Элемент #appScreen не найден. Проверь index.html.");
    return;
  }

  const vkState = await initVkBridge();
  console.log("VK state:", vkState);

  appScreen.classList.remove("hidden");

  initMainTabs();
  bindUiActions();

  initCharacterDeleteConfirm({
    onReloadCabinet: loadCabinet
  });

  initCharacterCreateFeature({
    onCreated: loadCabinet
  });

  await loadCabinet();

  if (!vkState.ok) {
    showToast("VK Bridge не инициализировался. Проверь запуск внутри VK.", "error", 5000);
  }
}

document.addEventListener("DOMContentLoaded", init);
