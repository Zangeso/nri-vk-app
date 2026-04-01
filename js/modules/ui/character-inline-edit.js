import { updateCharacter } from '../services/character.service.js';

function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function getFile(id) {
  const element = document.getElementById(id);
  return element && element.files ? element.files[0] || null : null;
}

export async function saveInlineCharacterForm(characterId, oldTrackUrl = null) {
  if (!characterId) {
    throw new Error("Не передан ID персонажа");
  }

  const name = getValue("inlineCharacterName");
  const race = getValue("inlineCharacterRace");
  const className = getValue("inlineCharacterClass");
  const description = getValue("inlineCharacterDescription");
  const trackFile = getFile("inlineCharacterTrackFile");

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
    oldTrackUrl
  );

  return updatedCharacter;
}