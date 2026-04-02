import { initMainTabs } from './modules/ui/tabs.js';
import { showToast } from './modules/toast.js';
import { closeModal } from './modules/ui/modal.js';
import { initCharacterCreateFeature } from './modules/features/character-create/character-create.feature.js';
import {
  renderRelatedPlayersScreen
} from './modules/screens/related-players/related-players.screen.js';
import {
  resolveAppUser,
  getLocalPlayerId,
  clearLocalPlayer,
  getDevParams,
  buildMockVkUser
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

function initCabinetSubtabs() {
  const buttons = document.querySelectorAll("[data-cabinet-panel]");
  const panels = document.querySelectorAll(".cabinet-subpanel");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const panelId = button.getAttribute("data-cabinet-panel");

      buttons.forEach((btn) => btn.classList.remove("active"));
      panels.forEach((panel) => panel.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(panelId)?.classList.add("active");
    });
  });
}

function applyRoleUi(player, devParams) {
  const adminLinkBtn = $("adminLinkBtn");
  const resetTestPlayerBtn = $("resetTestPlayerBtn");

  if (adminLinkBtn) {
  const isAdmin = player?.role === "admin";
  adminLinkBtn.classList.toggle("hidden", !isAdmin);
  adminLinkBtn.href = `admin.html${window.location.search || ""}${window.location.hash || ""}`;
}

  if (resetTestPlayerBtn) {
    const isVisible = devParams.enabled || player?.auth_provider === "local_test";
    resetTestPlayerBtn.classList.toggle("hidden", !isVisible);
  }
}

function getLaunchParamsFromBridge() {
  if (!window.vkBridge) return null;

  try {
    if (typeof window.vkBridge.parseURLSearchParams === "function") {
      return window.vkBridge.parseURLSearchParams(window.location.href);
    }
  } catch (e) {
    console.warn("Не удалось прочитать launch params через parseURLSearchParams", e);
  }

  try {
    return Object.fromEntries(new URLSearchParams(window.location.search).entries());
  } catch (e) {
    console.warn("Не удалось прочитать launch params через URLSearchParams", e);
  }

  return null;
}

function applyVkEnvironment(vkState = {}) {
  const html = document.documentElement;
  const body = document.body;
  const launchParams = vkState?.launchParams || {};
  const platform = String(launchParams?.vk_platform || "").trim();

  if (platform) {
    html.dataset.vkPlatform = platform;
    body.dataset.vkPlatform = platform;
  } else {
    delete html.dataset.vkPlatform;
    delete body.dataset.vkPlatform;
  }

  const isVkMiniApp = Boolean(window.vkBridge && !vkState?.isDevMock);

  if (isVkMiniApp) {
    html.dataset.vkMiniApp = "1";
    body.dataset.vkMiniApp = "1";
  } else {
    delete html.dataset.vkMiniApp;
    delete body.dataset.vkMiniApp;
  }
}

function applyVkAdaptivity(adaptivity = null) {
  const html = document.documentElement;
  const body = document.body;

  const type = String(adaptivity?.type || "").trim();
  const viewportWidth = Number(adaptivity?.viewportWidth || window.innerWidth || 0);
  const viewportHeight = Number(adaptivity?.viewportHeight || window.innerHeight || 0);

  if (type) {
    html.dataset.vkAdaptivity = type;
    body.dataset.vkAdaptivity = type;
  } else {
    delete html.dataset.vkAdaptivity;
    delete body.dataset.vkAdaptivity;
  }

  if (viewportWidth > 0) {
    html.style.setProperty("--vk-viewport-width", `${viewportWidth}px`);
    body.style.setProperty("--vk-viewport-width", `${viewportWidth}px`);
  }

  if (viewportHeight > 0) {
    html.style.setProperty("--vk-viewport-height", `${viewportHeight}px`);
    body.style.setProperty("--vk-viewport-height", `${viewportHeight}px`);
  }
}

function updateViewportCssVars() {
  const html = document.documentElement;
  const body = document.body;

  html.style.setProperty("--app-window-width", `${window.innerWidth}px`);
  html.style.setProperty("--app-window-height", `${window.innerHeight}px`);

  body.style.setProperty("--app-window-width", `${window.innerWidth}px`);
  body.style.setProperty("--app-window-height", `${window.innerHeight}px`);
}

function subscribeVkAdaptivity() {
  if (!window.vkBridge || typeof window.vkBridge.subscribe !== "function") {
    return;
  }

  window.vkBridge.subscribe((event) => {
    const detail = event?.detail;

    if (!detail) return;

    if (detail.type === "VKWebAppUpdateConfig") {
      const adaptivity = detail.data?.adaptivity || null;
      applyVkAdaptivity(adaptivity);
    }

    if (detail.type === "VKWebAppViewportChanged") {
      updateViewportCssVars();
    }
  });
}

async function initVkBridge(devParams) {
  if (devParams.enabled && devParams.vkMock) {
    return {
      ok: true,
      launchParams: {
        vk_platform: "desktop_web"
      },
      userInfo: buildMockVkUser(devParams),
      adaptivity: null,
      isDevMock: true
    };
  }

  if (!window.vkBridge) {
    console.warn("VK Bridge не найден");
    return {
      ok: false,
      launchParams: null,
      userInfo: null,
      adaptivity: null,
      isDevMock: false
    };
  }

  try {
    await window.vkBridge.send("VKWebAppInit");

    let launchParams = null;
    let userInfo = null;
    let config = null;

    try {
      launchParams = getLaunchParamsFromBridge();
    } catch (e) {
      console.warn("Не удалось получить launch params", e);
    }

    try {
      userInfo = await window.vkBridge.send("VKWebAppGetUserInfo");
      console.log("VK user info:", userInfo);
    } catch (e) {
      console.warn("Не удалось получить данные пользователя VK", e);
    }

    try {
      config = await window.vkBridge.send("VKWebAppGetConfig");
    } catch (e) {
      console.warn("Не удалось получить VK config", e);
    }

    return {
      ok: true,
      launchParams,
      userInfo,
      adaptivity: config?.adaptivity || null,
      isDevMock: false
    };
  } catch (error) {
    console.error("Ошибка инициализации VK Bridge:", error);

    if (devParams.enabled) {
      return {
        ok: true,
        launchParams: {
          vk_platform: "desktop_web"
        },
        userInfo: buildMockVkUser(devParams),
        adaptivity: null,
        isDevMock: true
      };
    }

    return {
      ok: false,
      launchParams: null,
      userInfo: null,
      adaptivity: null,
      isDevMock: false
    };
  }
}

async function loadCabinet(vkUserInfo = null, devParams = getDevParams()) {
  let playerId = getLocalPlayerId();

  if (!playerId) {
    const player = await resolveAppUser(vkUserInfo, { devParams });
    if (!player) return null;
    playerId = player.id;
  }

  let player = await renderPlayerProfileScreen(playerId);

  if (!player) {
    clearLocalPlayer();

    const fallbackPlayer = await resolveAppUser(vkUserInfo, { devParams });
    if (!fallbackPlayer) return null;

    playerId = fallbackPlayer.id;
    player = await renderPlayerProfileScreen(playerId);
  }

  if (!player) return null;

  applyRoleUi(player, devParams);

  await renderCharactersScreen({
    playerId,
    onOpenAchievement: openAchievementDetailModal,
    onReloadCabinet: () => loadCabinet(vkUserInfo, devParams)
  });

  await renderRelatedPlayersScreen({
    playerId,
    onOpenAchievement: openAchievementDetailModal
  });

  await renderAchievementsScreen({
    playerId,
    onOpenAchievement: openAchievementDetailModal
  });

  await renderStoriesScreen({
    playerId,
    onOpenAchievement: openAchievementDetailModal
  });

  return player;
}

function bindUiActions(vkUserInfo = null, devParams = getDevParams()) {
  $("resetTestPlayerBtn")?.addEventListener("click", async () => {
    clearLocalPlayer();
    localStorage.removeItem("nri_test_external_id");
    localStorage.removeItem("nri_owner_mode");
    localStorage.removeItem("nri_admin_id");
    showToast("Локальный вход сброшен", "success");
    await loadCabinet(vkUserInfo, devParams);
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

  const devParams = getDevParams();
  const vkState = await initVkBridge(devParams);

  console.log("VK state:", vkState);
  console.log("DEV params:", devParams);

  updateViewportCssVars();
  applyVkEnvironment(vkState);
  applyVkAdaptivity(vkState.adaptivity);
  subscribeVkAdaptivity();

  window.addEventListener("resize", updateViewportCssVars);

  appScreen.classList.remove("hidden");

  initMainTabs();
  initCabinetSubtabs();
  bindUiActions(vkState.userInfo, devParams);

  initCharacterDeleteConfirm({
    onReloadCabinet: () => loadCabinet(vkState.userInfo, devParams)
  });

  initCharacterCreateFeature({
    onCreated: () => loadCabinet(vkState.userInfo, devParams)
  });

  const player = await loadCabinet(vkState.userInfo, devParams);
  applyRoleUi(player, devParams);

  if (devParams.enabled) {
    showToast(`DEV режим: ${devParams.role}`, "success", 2500);
  } else if (!vkState.ok) {
    showToast("VK Bridge не инициализировался. Проверь запуск внутри VK.", "error", 5000);
  }
}

document.addEventListener("DOMContentLoaded", init);
