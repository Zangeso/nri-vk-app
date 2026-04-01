import { supabase } from '../supabase.js';
import { uploadImage, uploadAudio } from './storage.service.js';

function buildSessionPayload(sessionData, sessionTrackUrl, coverUrl) {
  return {
    session_date: sessionData.date,
    world_id: sessionData.worldId,
    campaign_id: sessionData.campaignId || null,
    title: sessionData.title,
    recap_link: sessionData.recapLink || null,
    short_story: sessionData.resultText || null,
    session_track_url: sessionTrackUrl || null,
    cover_url: coverUrl || null
  };
}

function formatStageError(stage, error) {
  const message =
    error?.message ||
    error?.details ||
    error?.hint ||
    JSON.stringify(error) ||
    "неизвестная ошибка";

  return new Error(`этап ${stage}: ${message}`);
}

export async function getSessions() {
  const { data, error } = await supabase
    .from("sessions")
    .select(`*, worlds(title), campaigns(title)`)
    .order("session_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getSessionById(sessionId) {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error) throw error;
  return data;
}

export async function getSessionEntries(sessionId) {
  const { data, error } = await supabase
    .from("session_entries")
    .select(`*, characters(name, race)`)
    .eq("session_id", sessionId)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createSession(sessionData) {
  const { data, error } = await supabase
    .from("sessions")
    .insert([sessionData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSession(sessionId, sessionData) {
  const { data, error } = await supabase
    .from("sessions")
    .update(sessionData)
    .eq("id", sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSession(sessionId) {
  const { error: entriesError } = await supabase
    .from("session_entries")
    .delete()
    .eq("session_id", sessionId);
  if (entriesError) throw entriesError;

  const { error: participantsError } = await supabase
    .from("session_participants")
    .delete()
    .eq("session_id", sessionId);
  if (participantsError) throw participantsError;

  const { error: achievementsError } = await supabase
    .from("achievements")
    .delete()
    .eq("session_id", sessionId);
  if (achievementsError) throw achievementsError;

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);
  if (error) throw error;
}

export async function saveSessionWithParticipants(sessionId, sessionData, participants) {
  let newSessionId = sessionId || null;
  let sessionTrackUrl = null;
  let coverUrl = null;
  let createdFromScratch = false;

  try {
    if (sessionData.trackFile) {
      sessionTrackUrl = await uploadAudio(sessionData.trackFile, "session_track");
    }

    if (sessionData.coverBlob) {
      coverUrl = await uploadImage(sessionData.coverBlob, "session-covers", "session_cover");
    }

    if (newSessionId) {
      const currentSession = await getSessionById(newSessionId);

      const payload = buildSessionPayload(
        sessionData,
        sessionTrackUrl || currentSession.session_track_url || null,
        coverUrl || currentSession.cover_url || null
      );

      await updateSession(newSessionId, payload);

      const { error: deleteEntriesError } = await supabase
        .from("session_entries")
        .delete()
        .eq("session_id", newSessionId);
      if (deleteEntriesError) throw formatStageError("delete session_entries", deleteEntriesError);

      const { error: deleteParticipantsError } = await supabase
        .from("session_participants")
        .delete()
        .eq("session_id", newSessionId);
      if (deleteParticipantsError) throw formatStageError("delete session_participants", deleteParticipantsError);

      const { error: deleteAchievementsError } = await supabase
        .from("achievements")
        .delete()
        .eq("session_id", newSessionId);
      if (deleteAchievementsError) throw formatStageError("delete achievements", deleteAchievementsError);
    } else {
      const payload = buildSessionPayload(sessionData, sessionTrackUrl, coverUrl);
      const created = await createSession(payload);
      newSessionId = created.id;
      createdFromScratch = true;
    }

    for (let index = 0; index < participants.length; index += 1) {
      const participant = participants[index];

      if (!participant?.characterId) {
        throw new Error(`этап participant ${index + 1}: отсутствует characterId`);
      }

      const { error: participantError } = await supabase
        .from("session_participants")
        .insert([
          {
            session_id: newSessionId,
            character_id: participant.characterId
          }
        ]);
      if (participantError) {
        throw formatStageError(`session_participants #${index + 1}`, participantError);
      }

      let achievementImageUrl = null;

      if (participant.croppedImageBlob) {
        achievementImageUrl = await uploadImage(
          participant.croppedImageBlob,
          "achievements",
          "achievement_image"
        );
      } else if (
        participant.imagePreviewUrl &&
        !String(participant.imagePreviewUrl).startsWith("blob:")
      ) {
        achievementImageUrl = participant.imagePreviewUrl;
      }

      const { error: entryError } = await supabase
        .from("session_entries")
        .insert([
          {
            session_id: newSessionId,
            character_id: participant.characterId,
            display_order: index,
            achievement_title: participant.achievementTitle || null,
            achievement_description: participant.achievementDescription || null,
            achievement_image_url: achievementImageUrl || null
          }
        ]);
      if (entryError) {
        throw formatStageError(`session_entries #${index + 1}`, entryError);
      }

      if (participant.achievementTitle || participant.achievementDescription || achievementImageUrl) {
        const { error: achievementError } = await supabase
          .from("achievements")
          .insert([
            {
              session_id: newSessionId,
              character_id: participant.characterId,
              title: participant.achievementTitle || "Достижение",
              description: participant.achievementDescription || null,
              image_url: achievementImageUrl || null
            }
          ]);

        if (achievementError) {
          throw formatStageError(`achievements #${index + 1}`, achievementError);
        }
      }
    }

    return newSessionId;
  } catch (error) {
    if (createdFromScratch && newSessionId) {
      try {
        await deleteSession(newSessionId);
      } catch {
        // если откат не удался, просто не ломаем основной текст ошибки
      }
    }

    throw error;
  }
}