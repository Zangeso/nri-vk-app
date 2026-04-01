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

function renderVkDebugInfo(userInfo) {
  const status = $("vkDebugStatus");
  const info = $("vkDebugInfo");
  const avatar = $("vkDebugAvatar");

  if (!status || !info || !avatar) return;

  if (!userInfo) {
    status.textContent = "Не удалось получить данные пользователя VK";
    info.innerHTML = `
      <div><b>VK ID:</b> —</div>
      <div><b>Имя:</b> —</div>
      <div><b>Город:</b> —</div>
    `;
    avatar.style.display = "none";
    avatar.src = "";
    return;
  }

  const fullName = [userInfo.first_name, userInfo.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  status.textContent = "Данные из VK получены";
  info.innerHTML = `
    <div><b>VK ID:</b> ${userInfo.id ?? "—"}</div>
    <div><b>Имя:</b> ${fullName || "—"}</div>
    <div><b>Город:</b> ${userInfo.city?.title || "—"}</div>
  `;

  if (userInfo.photo_200 || userInfo.photo_100) {
    avatar.src = userInfo.photo_200 || userInfo.photo_100;
    avatar.style.display = "block";
  } else {
    avatar.style.display = "none";
    avatar.src = "";
  }
}

async function initVkBridge() {
  if (!window.vkBridge) {
    console.warn("VK Bridge не найден");
    return {
      ok: false,
      launchParams: null,
      userInfo: null
    };
  }

  try {
    await window.vkBridge.send("VKWebAppInit");

    let launchParams = null;
    let userInfo = null;

    try {
      launchParams = window.vkBridge.parseURLSearchParams(window.location.href);
    } catch (e) {
      console.warn("Не удалось прочитать launch params", e);
    }

    try {
      userInfo = await window.vkBridge.send("VKWebAppGetUserInfo");
      console.log("VK user info:", userInfo);
    } catch (e) {
      console.warn("Не удалось получить данные пользователя VK", e);
    }

    return {
      ok: true,
      launchParams,
      userInfo
    };
  } catch (error) {
    console.error("Ошибка инициализации VK Bridge:", error);
    return {
      ok: false,
      launchParams: null,
      userInfo: null
    };
  }
}

async function loadCabinet(vkUserInfo = null) {
  let playerId = getLocalPlayerId();

  if (!playerId) {
    const player = await resolveAppUser(vkUserInfo);
    if (!player) return;
    playerId = player.id;
  }

  const player = await renderPlayerProfileScreen(playerId);
  if (!player) {
    clearLocalPlayer();

    const fallbackPlayer = await resolveAppUser(vkUserInfo);
    if (!fallbackPlayer) return;

    playerId = fallbackPlayer.id;
    await renderPlayerProfileScreen(playerId);
  }

  await renderCharactersScreen({
    playerId,
    onOpenAchievement: openAchievementDetailModal,
    onReloadCabinet: () => loadCabinet(vkUserInfo)
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

function bindUiActions(vkUserInfo = null) {
  $("resetTestPlayerBtn")?.addEventListener("click", async () => {
    clearLocalPlayer();
    localStorage.removeItem("nri_test_external_id");
    localStorage.removeItem("nri_owner_mode");
    localStorage.removeItem("nri_admin_id");
    showToast("Локальный вход сброшен", "success");
    await loadCabinet(vkUserInfo);
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

  renderVkDebugInfo(vkState.userInfo);

  appScreen.classList.remove("hidden");

  initMainTabs();
  bindUiActions(vkState.userInfo);

  initCharacterDeleteConfirm({
    onReloadCabinet: () => loadCabinet(vkState.userInfo)
  });

  initCharacterCreateFeature({
    onCreated: () => loadCabinet(vkState.userInfo)
  });

  await loadCabinet(vkState.userInfo);

  if (!vkState.ok) {
    showToast("VK Bridge не инициализировался. Проверь запуск внутри VK.", "error", 5000);
  }
}

document.addEventListener("DOMContentLoaded", init);
