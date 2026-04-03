import { supabase } from '../supabase.js';
import { uploadImage, uploadAudio } from './storage.service.js';

export async function getCharactersByPlayer(playerId) {
const { data, error } = await supabase
.from("characters")
.select("id, name, race, class_name, description, avatar_url, track_url")
.eq("player_id", playerId)
.order("created_at", { ascending: false });

if (error) throw error;
return data || [];
}

export async function getCharacterById(characterId) {
const { data, error } = await supabase
.from("characters")
.select("*")
.eq("id", characterId)
.single();

if (error) throw error;
return data;
}

export async function createCharacter(playerId, characterData, avatarBlob = null, trackFile = null) {
let avatarUrl = null;
let trackUrl = null;

if (avatarBlob) {
avatarUrl = await uploadImage(avatarBlob, "avatars", "character_avatar");
}

if (trackFile) {
trackUrl = await uploadAudio(trackFile, "character_track");
}

const payload = {
player_id: playerId,
world_id: null,
name: characterData.name,
race: characterData.race || null,
class_name: characterData.className || null,
level: 1,
avatar_url: avatarUrl,
track_url: trackUrl,
description: characterData.description || null
};

const { data, error } = await supabase
.from("characters")
.insert([payload])
.select()
.single();

if (error) throw error;
return data;
}

export async function updateCharacter(characterId, characterData, trackFile = null, oldTrackUrl = null) {
let trackUrl = oldTrackUrl || null;

if (trackFile) {
trackUrl = await uploadAudio(trackFile, "character_track");
}

const payload = {
name: characterData.name,
race: characterData.race || null,
class_name: characterData.className || null,
track_url: trackUrl,
description: characterData.description || null
};

const { data, error } = await supabase
.from("characters")
.update(payload)
.eq("id", characterId)
.select()
.single();

if (error) throw error;
return data;
}

export async function deleteCharacter(characterId) {
const { error } = await supabase
.from("characters")
.delete()
.eq("id", characterId);

if (error) throw error;
}

export async function getWorldsByCharacterIds(characterIds) {
  if (!Array.isArray(characterIds) || !characterIds.length) {
    return {};
  }

  const { data, error } = await supabase
    .from("session_entries")
    .select(`
      character_id,
      sessions (
        session_date,
        worlds (
          title
        )
      )
    `)
    .in("character_id", characterIds);

  if (error) throw error;

  const map = {};

  for (const characterId of characterIds) {
    map[characterId] = [];
  }

  const worldBuckets = new Map();

  for (const row of data || []) {
    const characterId = row.character_id;
    const worldTitle = row.sessions?.worlds?.title || "";
    const sessionTime = row.sessions?.session_date
      ? new Date(row.sessions.session_date).getTime()
      : 0;

    if (!characterId || !worldTitle) continue;

    if (!worldBuckets.has(characterId)) {
      worldBuckets.set(characterId, new Map());
    }

    const byWorld = worldBuckets.get(characterId);
    const prevTime = byWorld.get(worldTitle) || 0;

    if (sessionTime > prevTime) {
      byWorld.set(worldTitle, sessionTime);
    }
  }

  for (const [characterId, byWorld] of worldBuckets.entries()) {
    map[characterId] = [...byWorld.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([title]) => title);
  }

  return map;
}

export async function getFavoriteCharacterByPlayer(playerId) {
  if (!playerId) return null;

  const { data: characters, error: charactersError } = await supabase
    .from("characters")
    .select("id, name, race, class_name, description, avatar_url, track_url, created_at")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });

  if (charactersError) throw charactersError;

  const characterList = characters || [];
  if (!characterList.length) return null;

  const characterIds = characterList.map((item) => item.id);

  const { data: entries, error: entriesError } = await supabase
    .from("session_entries")
    .select(`
      character_id,
      sessions (
        id,
        session_date
      )
    `)
    .in("character_id", characterIds);

  if (entriesError) throw entriesError;

  if (!entries?.length) {
    return characterList[0] || null;
  }

  const statMap = new Map();

  for (const character of characterList) {
    statMap.set(String(character.id), {
      count: 0,
      latestSessionTime: 0
    });
  }

  for (const row of entries) {
    const characterId = String(row.character_id || "");
    if (!characterId || !statMap.has(characterId)) continue;

    const bucket = statMap.get(characterId);
    bucket.count += 1;

    const sessionTime = row.sessions?.session_date
      ? new Date(row.sessions.session_date).getTime()
      : 0;

    if (sessionTime > bucket.latestSessionTime) {
      bucket.latestSessionTime = sessionTime;
    }
  }

  const rankedCharacters = [...characterList].sort((a, b) => {
    const aStat = statMap.get(String(a.id)) || { count: 0, latestSessionTime: 0 };
    const bStat = statMap.get(String(b.id)) || { count: 0, latestSessionTime: 0 };

    if (bStat.count !== aStat.count) {
      return bStat.count - aStat.count;
    }

    if (bStat.latestSessionTime !== aStat.latestSessionTime) {
      return bStat.latestSessionTime - aStat.latestSessionTime;
    }

    const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;

    return bCreated - aCreated;
  });

  return rankedCharacters[0] || null;
}