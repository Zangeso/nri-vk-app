import { supabase } from '../supabase.js';

export async function getAchievementsByPlayer(playerId) {
  if (!playerId) return [];

  const { data: characters, error: charactersError } = await supabase
    .from("characters")
    .select("id")
    .eq("player_id", playerId);

  if (charactersError) throw charactersError;

  const characterIds = (characters || []).map((item) => item.id);

  if (!characterIds.length) {
    return [];
  }

  const { data: achievements, error: achievementsError } = await supabase
    .from("achievements")
    .select(`
      *,
      characters(name),
      sessions(title, session_date)
    `)
    .in("character_id", characterIds)
    .order("created_at", { ascending: false });

  if (achievementsError) throw achievementsError;

  return achievements || [];
}