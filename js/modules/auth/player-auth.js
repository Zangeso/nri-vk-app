import { supabase } from '../supabase.js';
import { showToast } from '../toast.js';

const PLAYER_STORAGE_KEY = "nri_player_id";
const TEST_EXTERNAL_KEY = "nri_test_external_id";
const OWNER_MODE_KEY = "nri_owner_mode";
const ADMIN_STORAGE_KEY = "nri_admin_id";

export function getLocalPlayerId() {
  return localStorage.getItem(PLAYER_STORAGE_KEY);
}

export function setLocalPlayer(playerId) {
  if (!playerId) return;
  localStorage.setItem(PLAYER_STORAGE_KEY, playerId);
}

export function clearLocalPlayer() {
  localStorage.removeItem(PLAYER_STORAGE_KEY);
}

function getOrCreateStableExternalId() {
  let id = localStorage.getItem(TEST_EXTERNAL_KEY);

  if (!id) {
    id = "test_" + crypto.randomUUID();
    localStorage.setItem(TEST_EXTERNAL_KEY, id);
  }

  return id;
}

async function resolveOwnerUser() {
  const adminId = localStorage.getItem(ADMIN_STORAGE_KEY);

  if (adminId) {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("id", adminId)
      .maybeSingle();

    if (!error && data) {
      setLocalPlayer(data.id);
      return data;
    }
  }

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("auth_provider", "local_test")
    .eq("external_auth_id", "owner_local")
    .maybeSingle();

  if (error) {
    showToast("Ошибка поиска владельца: " + error.message, "error");
    return null;
  }

  if (data) {
    setLocalPlayer(data.id);
    return data;
  }

  return null;
}

async function resolveVkUser(vkUserInfo) {
  if (!vkUserInfo?.id) {
    return null;
  }

  const externalAuthId = String(vkUserInfo.id);
  const fullName = [vkUserInfo.first_name, vkUserInfo.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const avatarUrl =
    vkUserInfo.photo_200 ||
    vkUserInfo.photo_100 ||
    "";

  const fallbackNickname =
    vkUserInfo.first_name?.trim() ||
    `Игрок VK ${externalAuthId}`;

  const { data: existing, error: findError } = await supabase
    .from("players")
    .select("*")
    .eq("auth_provider", "vk")
    .eq("external_auth_id", externalAuthId)
    .maybeSingle();

  if (findError) {
    showToast("Ошибка поиска VK-игрока: " + findError.message, "error");
    return null;
  }

  if (existing) {
    const updates = {};
    const existingFullName = String(existing.full_name || "").trim();
    const existingAvatar = String(existing.avatar_url || "").trim();
    const existingNickname = String(existing.nickname || "").trim();

    if (fullName && existingFullName !== fullName) {
      updates.full_name = fullName;
    }

    if (avatarUrl && existingAvatar !== avatarUrl) {
      updates.avatar_url = avatarUrl;
    }

    if (!existingNickname && fallbackNickname) {
      updates.nickname = fallbackNickname;
    }

    if (Object.keys(updates).length) {
      const { data: updated, error: updateError } = await supabase
        .from("players")
        .update(updates)
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) {
        showToast("Ошибка обновления VK-профиля: " + updateError.message, "error");
        setLocalPlayer(existing.id);
        return existing;
      }

      setLocalPlayer(updated.id);
      return updated;
    }

    setLocalPlayer(existing.id);
    return existing;
  }

  const { data: created, error: createError } = await supabase
    .from("players")
    .insert([{
      nickname: fallbackNickname,
      full_name: fullName,
      avatar_url: avatarUrl,
      role: "player",
      auth_provider: "vk",
      external_auth_id: externalAuthId
    }])
    .select()
    .single();

  if (createError) {
    showToast("Ошибка создания VK-игрока: " + createError.message, "error");
    return null;
  }

  setLocalPlayer(created.id);
  return created;
}

async function resolveLocalTestUser() {
  const ownerMode = localStorage.getItem(OWNER_MODE_KEY) === "1";

  if (ownerMode) {
    const owner = await resolveOwnerUser();
    if (owner) return owner;
  }

  const externalId = getOrCreateStableExternalId();

  const { data: existing, error: findError } = await supabase
    .from("players")
    .select("*")
    .eq("auth_provider", "local_test")
    .eq("external_auth_id", externalId)
    .maybeSingle();

  if (findError) {
    showToast("Ошибка поиска игрока: " + findError.message, "error");
    return null;
  }

  if (existing) {
    setLocalPlayer(existing.id);
    return existing;
  }

  const nickname = "Игрок " + Math.floor(Math.random() * 10000);

  const { data: created, error: createError } = await supabase
    .from("players")
    .insert([{
      nickname,
      full_name: "",
      avatar_url: "",
      role: "player",
      auth_provider: "local_test",
      external_auth_id: externalId
    }])
    .select()
    .single();

  if (createError) {
    showToast("Ошибка создания игрока: " + createError.message, "error");
    return null;
  }

  setLocalPlayer(created.id);
  return created;
}

export async function resolveAppUser(vkUserInfo = null) {
  if (vkUserInfo?.id) {
    const vkPlayer = await resolveVkUser(vkUserInfo);
    if (vkPlayer) return vkPlayer;
  }

  return resolveLocalTestUser();
}
