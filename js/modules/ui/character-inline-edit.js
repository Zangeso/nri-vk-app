import { updateCharacter } from '../services/character.service.js';

function getInputValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function getTextareaValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function getFile(id) {
  const element = document.getElementById(id);
  return element && element.files ? element.files[0] || null : null;
}

export async function saveInlineCharacterForm(
  characterId,
  oldTrackUrl = null,
  oldAvatarUrl = null
) {
  if (!characterId) {
    throw new Error("Не передан ID персонажа");
  }

  const name = getInputValue("inlineCharacterName");
  const race = getInputValue("inlineCharacterRace");
  const className = getInputValue("inlineCharacterClass");
  const description = getTextareaValue("inlineCharacterDescription");

  const trackFile = getFile("inlineCharacterTrackFile");
  const avatarFile = getFile("inlineCharacterAvatarFile");

  if (!name) {
    throw new Error("Введите имя персонажа");
  }

  const updatedCharacter = await updateCharacter(
    characterId,
    {
      name,
      race,
      className,
      description
    },
    trackFile,
    oldTrackUrl,
    avatarFile,
    oldAvatarUrl
  );

  return updatedCharacter;
}