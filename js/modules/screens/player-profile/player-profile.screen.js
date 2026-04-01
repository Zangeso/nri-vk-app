import {
  getPlayerById,
  updatePlayerNickname as updatePlayerNicknameInDb
} from '../../services/player.service.js';

import { showToast } from '../../toast.js';
import { openModal, closeModal } from '../../ui/modal.js';

const DEFAULT_AVATAR = "https://placehold.co/200x200?text=Player";

function $(id) {
  return document.getElementById(id);
}

export async function renderPlayerProfileScreen(playerId) {
  try {
    const player = await getPlayerById(playerId);

    if (!player) {
      showToast("Игрок не найден", "error");
      return null;
    }

    if ($("playerAvatar")) {
      $("playerAvatar").src = player.avatar_url || DEFAULT_AVATAR;
    }

    if ($("playerNickname")) {
      $("playerNickname").textContent = player.nickname || "Игрок";
    }

    if ($("playerFullName")) {
      $("playerFullName").textContent = player.full_name || "Имя из VK появится позже";
    }

    if ($("nicknameInput")) {
      $("nicknameInput").value = player.nickname || "";
    }

    return player;
  } catch (error) {
    showToast("Ошибка загрузки профиля: " + error.message, "error");
    return null;
  }
}

export function openNicknameModal() {
  if ($("nicknameInput") && $("playerNickname")) {
    $("nicknameInput").value = $("playerNickname").textContent.trim();
  }

  openModal("nicknameModal");
}

export async function savePlayerNickname() {
  const playerId = localStorage.getItem("nri_player_id");
  const nickname = $("nicknameInput")?.value?.trim() || "";

  if (!playerId) {
    showToast("Игрок не найден", "error");
    return false;
  }

  if (!nickname) {
    showToast("Введите ник", "error");
    return false;
  }

  try {
    const updatedPlayer = await updatePlayerNicknameInDb(playerId, nickname);

    if ($("playerNickname")) {
      $("playerNickname").textContent = updatedPlayer.nickname || "Игрок";
    }

    if ($("nicknameInput")) {
      $("nicknameInput").value = updatedPlayer.nickname || "";
    }

    closeModal("nicknameModal");
    showToast("Ник сохранён", "success");
    return true;
  } catch (error) {
    showToast("Ошибка сохранения ника: " + error.message, "error");
    return false;
  }
}