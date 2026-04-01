import { deleteCharacter } from '../services/character.service.js';

export async function removeCharacterById(characterId) {
  if (!characterId) {
    throw new Error("Не передан ID персонажа");
  }

  await deleteCharacter(characterId);
}