import { supabase } from '../supabase.js';

export async function getCharacterIdsByPlayer(playerId) {
  if (!playerId) return [];

  const { data, error } = await supabase
    .from("characters")
    .select("id")
    .eq("player_id", playerId);

  if (error) throw error;

  return (data || []).map((item) => item.id);
}

export async function getUniqueSessionsByCharacterIds(characterIds) {
  if (!Array.isArray(characterIds) || !characterIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("session_participants")
    .select(`
      *,
      sessions (
        id,
        title,
        session_date,
        short_story,
        recap_link,
        session_track_url,
        cover_url,
        worlds ( title ),
        campaigns ( title )
      )
    `)
    .in("character_id", characterIds);

  if (error) throw error;

  const uniqueSessions = [];
  const used = new Set();

  for (const item of data || []) {
    const session = item.sessions;
    if (!session || used.has(session.id)) continue;

    used.add(session.id);
    uniqueSessions.push(session);
  }

  uniqueSessions.sort((a, b) => {
    return new Date(b.session_date) - new Date(a.session_date);
  });

  return uniqueSessions;
}

export async function getSessionEntriesBySessionIds(sessionIds) {
  if (!Array.isArray(sessionIds) || !sessionIds.length) {
    return {};
  }

  const { data, error } = await supabase
    .from("session_entries")
    .select(`
      *,
      characters (
        name,
        race,
        players ( nickname )
      )
    `)
    .in("session_id", sessionIds)
    .order("display_order", { ascending: true });

  if (error) throw error;

  const entriesBySession = {};

  for (const entry of data || []) {
    if (!entriesBySession[entry.session_id]) {
      entriesBySession[entry.session_id] = [];
    }

    entriesBySession[entry.session_id].push(entry);
  }

  return entriesBySession;
}