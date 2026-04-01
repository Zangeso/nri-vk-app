import { escapeHtml, cleanDisplayText } from '../utils.js';

const DEFAULT_CHARACTER_AVATAR = "https://placehold.co/400x400?text=Hero";

function setText(id, value) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = value;
}

function setHtml(id, value) {
  const element = document.getElementById(id);
  if (!element) return;
  element.innerHTML = value;
}

function setImage(id, src, alt = "avatar") {
  const element = document.getElementById(id);
  if (!element) return;
  element.src = src;
  element.alt = alt;
}

function setAudioSource(audioId, sourceId, trackUrl) {
  const audio = document.getElementById(audioId);
  const source = document.getElementById(sourceId);

  if (!audio || !source) return;

  if (trackUrl) {
    audio.classList.remove("hidden");
    source.src = trackUrl;
    audio.load();
    return;
  }

  source.src = "";
  audio.classList.add("hidden");
  audio.load();
}

export function fillCharacterView(character) {
  if (!character) return;

  setImage(
    "viewCharacterAvatar",
    character.avatar_url || DEFAULT_CHARACTER_AVATAR,
    character.name || "character avatar"
  );

  setText("viewCharacterName", character.name || "Без имени");
  setText("viewCharacterRace", cleanDisplayText(character.race || "Не указана раса"));
  setText("viewCharacterClass", cleanDisplayText(character.class_name || "Не указан класс"));
  setText("viewCharacterLevel", String(character.level || 1));

  setHtml(
    "viewCharacterDescription",
    escapeHtml(character.description || "Описание отсутствует")
  );

  setAudioSource(
    "viewCharacterAudio",
    "viewCharacterAudioSource",
    character.track_url || ""
  );
}