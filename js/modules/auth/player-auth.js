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

export async function resolveAppUser() {
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