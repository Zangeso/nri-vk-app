import {
  initAdminSessionsScreen,
  renderPublishedSessionsAdmin
} from './modules/screens/admin-sessions/admin-sessions.screen.js';

import {
  loadWorldsWithCampaigns,
  loadWorldOptionsForAdmin,
  loadCampaignOptionsForAdmin,
  initAdminWorldsScreen
} from './modules/screens/admin-worlds/admin-worlds.screen.js';

import {
  initAdminParticipantsScreen,
  renderParticipantChips
} from './modules/screens/admin-participants/admin-participants.screen.js';

import { showToast } from './modules/toast.js';

import {
  getLocalPlayerId,
  setLocalPlayer,
  clearLocalPlayer,
  getDevParams,
  buildMockVkUser,
  resolveAppUser
} from './modules/auth/player-auth.js';

import { clearAdminId } from './modules/auth/admin-auth.js';
import { getPlayerById } from './modules/services/player.service.js';
import { supabase } from './modules/supabase.js';

function $(id) {
  return document.getElementById(id);
}

async function initVkBridge(devParams) {
  if (devParams.enabled && devParams.vkMock) {
    return {
      ok: true,
      userInfo: buildMockVkUser(devParams),
      isDevMock: true
    };
  }

  if (!window.vkBridge) {
    return {
      ok: false,
      userInfo: null,
      isDevMock: false
    };
  }

  try {
    await window.vkBridge.send("VKWebAppInit");

    let userInfo = null;

    try {
      userInfo = await window.vkBridge.send("VKWebAppGetUserInfo");
    } catch (e) {
      console.warn("Не удалось получить данные пользователя VK", e);
    }

    return {
      ok: true,
      userInfo,
      isDevMock: false
    };
  } catch (error) {
    console.error("Ошибка инициализации VK Bridge:", error);

    if (devParams.enabled) {
      return {
        ok: true,
        userInfo: buildMockVkUser(devParams),
        isDevMock: true
      };
    }

    return {
      ok: false,
      userInfo: null,
      isDevMock: false
    };
  }
}

async function resolveVkPlayer(vkUserInfo) {
  if (!vkUserInfo?.id) return null;

  const externalAuthId = String(vkUserInfo.id);

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("auth_provider", "vk")
    .eq("external_auth_id", externalAuthId)
    .maybeSingle();

  if (error) {
    showToast("Ошибка поиска игрока: " + error.message, "error");
    return null;
  }

  if (data) {
    setLocalPlayer(data.id);
    return data;
  }

  return null;
}

async function resolveCurrentPlayer(vkUserInfo, devParams) {
  const localPlayerId = getLocalPlayerId();

  if (localPlayerId) {
    try {
      const player = await getPlayerById(localPlayerId);
      if (player) return player;
    } catch (e) {
      console.warn("Не удалось загрузить локального игрока", e);
    }
  }

  if (devParams.enabled) {
    const devPlayer = await resolveAppUser(vkUserInfo, { devParams });
    if (devPlayer) return devPlayer;
  }

  if (vkUserInfo?.id) {
    const vkPlayer = await resolveVkPlayer(vkUserInfo);
    if (vkPlayer) return vkPlayer;
  }

  return null;
}

async function loadAdminData() {
  await loadWorldsWithCampaigns();
  await loadWorldOptionsForAdmin();
  await loadCampaignOptionsForAdmin($("sessionWorld")?.value || null);
  await renderPublishedSessionsAdmin();
  renderParticipantChips();
}

function initTabs() {
  document.querySelectorAll(".main-tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".main-tab-button").forEach((btn) => {
        btn.classList.remove("active");
      });

      document.querySelectorAll(".main-tab-panel").forEach((panel) => {
        panel.classList.remove("active");
      });

      button.classList.add("active");

      const panelId = button.getAttribute("data-main-tab");
      const panel = document.getElementById(panelId);

      if (panel) {
        panel.classList.add("active");
      }
    });
  });
}

function bindAdminExit() {
  const exitBtn = $("adminExitBtn");
  if (!exitBtn || exitBtn.dataset.bound === "1") return;

  exitBtn.addEventListener("click", () => {
    clearAdminId();
    clearLocalPlayer();
    localStorage.removeItem("nri_owner_mode");

    showToast("Выход из админки выполнен", "success", 1800);

    window.location.href = `index.html${window.location.search || ""}${window.location.hash || ""}`;
  });

  exitBtn.dataset.bound = "1";
}

function showDenied(player, vkState, devParams) {
  $("adminLoadingCard")?.classList.add("hidden");
  $("adminPanel")?.classList.add("hidden");
  $("adminDeniedCard")?.classList.remove("hidden");

  const info = $("adminDeniedInfo");
  if (!info) return;

  const role = player?.role || "неизвестно";
  const playerId = player?.id || "—";
  const vkId = vkState?.userInfo?.id || "—";

  info.innerHTML = `
    <div><b>Текущий player id:</b> ${playerId}</div>
    <div><b>Текущая роль:</b> ${role}</div>
    <div><b>VK ID:</b> ${vkId}</div>
    <div><b>DEV режим:</b> ${devParams.enabled ? "включён" : "выключен"}</div>
    <div style="margin-top:10px;">
      Чтобы получить доступ, у записи в таблице <b>players</b> должна быть роль <b>admin</b>.
    </div>
  `;
}

async function showAdmin(devParams) {
  $("adminLoadingCard")?.classList.add("hidden");
  $("adminDeniedCard")?.classList.add("hidden");
  $("adminPanel")?.classList.remove("hidden");

  initTabs();
  initAdminWorldsScreen();
  initAdminParticipantsScreen();
  initAdminSessionsScreen();
  bindAdminExit();

  await loadAdminData();

  if (devParams.enabled) {
    showToast(`DEV админка: ${devParams.role}`, "success", 2500);
  }
}

async function initAdmin() {
  try {
    const devParams = getDevParams();
    const vkState = await initVkBridge(devParams);
    const player = await resolveCurrentPlayer(vkState.userInfo, devParams);

    if (!player) {
      showDenied(null, vkState, devParams);
      return;
    }

    if (player.role !== "admin") {
      showDenied(player, vkState, devParams);
      return;
    }

    await showAdmin(devParams);
  } catch (error) {
    console.error("Ошибка запуска админки:", error);

    $("adminLoadingCard")?.classList.add("hidden");
    $("adminDeniedCard")?.classList.remove("hidden");

    const info = $("adminDeniedInfo");
    if (info) {
      info.innerHTML = `
        <div><b>Админка не запустилась.</b></div>
        <div style="margin-top:8px;">${String(error?.message || error)}</div>
      `;
    }

    showToast("Ошибка запуска админки", "error");
  }
}

document.addEventListener("DOMContentLoaded", initAdmin);