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

export async function getLatestWorldByCharacterIds(characterIds) {
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
    .in("character_id", characterIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const map = {};

  for (const row of data || []) {
    if (!row.character_id) continue;
    if (map[row.character_id]) continue;

    map[row.character_id] = row.sessions?.worlds?.title || "";
  }

  return map;
}