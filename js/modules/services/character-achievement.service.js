import { supabase } from '../supabase.js';

export async function getAchievementsByCharacter(characterId) {
  if (!characterId) return [];

  const { data, error } = await supabase
    .from("achievements")
    .select(`
      *,
      sessions (
        title,
        session_date
      )
    `)
    .eq("character_id", characterId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}