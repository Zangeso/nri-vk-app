import { supabase } from '../supabase.js';

export async function getPlayerById(playerId) {
  if (!playerId) return null;

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();

  if (error) throw error;
  return data;
}

export async function updatePlayerNickname(playerId, nickname) {
  if (!playerId) {
    throw new Error("Не передан ID игрока");
  }

  const normalizedNickname = String(nickname || "").trim();

  if (!normalizedNickname) {
    throw new Error("Ник не может быть пустым");
  }

  const { data, error } = await supabase
    .from("players")
    .update({
      nickname: normalizedNickname
    })
    .eq("id", playerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePlayerProfile(playerId, profileData = {}) {
  if (!playerId) {
    throw new Error("Не передан ID игрока");
  }

  const payload = {
    nickname: profileData.nickname ?? undefined,
    full_name: profileData.fullName ?? undefined,
    avatar_url: profileData.avatarUrl ?? undefined
  };

  const cleanedPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

  const { data, error } = await supabase
    .from("players")
    .update(cleanedPayload)
    .eq("id", playerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}