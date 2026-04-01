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

async function init() {
  const appScreen = $("appScreen");

  if (!appScreen) {
    console.error("Элемент #appScreen не найден. Проверь index.html.");
    return;
  }

  appScreen.classList.remove("hidden");

  initMainTabs();
  await loadCabinet();

  initCharacterDeleteConfirm({
    onReloadCabinet: loadCabinet
  });

  initCharacterCreateFeature({
    onCreated: loadCabinet
  });

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

document.addEventListener("DOMContentLoaded", init);