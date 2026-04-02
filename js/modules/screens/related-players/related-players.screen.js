import { getCharacterIdsByPlayer, getUniqueSessionsByCharacterIds } from '../../services/story.service.js';
import { getAchievementsByPlayer } from '../../services/achievement.service.js';
import { openReadOnlyCharacterModal } from '../characters/characters.screen.js';
import { openModal } from '../../ui/modal.js';
import { supabase } from '../../supabase.js';

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;")
    .split("'").join("&#39;");
}

function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("ru-RU");
}

function renderRelatedEmptyState(message = "Пока нет игроков из последних общих сессий.") {
  return `<div class="dashboard-empty-state">${escapeHtml(message)}</div>`;
}

function buildCompactRelatedRow(item) {
  return `
    <button
      class="dashboard-related-row compact-related-row dashboard-related-row-v2"
      type="button"
      data-player-id="${item.playerId}"
      data-character-id="${item.characterId || ""}"
      data-player-name="${escapeHtml(item.playerName)}"
      data-character-name="${escapeHtml(item.characterName || "—")}"
      data-achievement-title="${escapeHtml(item.achievementTitle || "без достижения")}"
      title="Открыть информацию об игроке"
    >
      <div class="dashboard-related-main">
        <div class="dashboard-related-topline">
          <strong class="dashboard-related-player-name">
            ${escapeHtml(item.playerName)}
          </strong>
        </div>

        <div class="dashboard-related-character-line">
          Персонаж: ${escapeHtml(item.characterName || "—")}
        </div>

        <div class="dashboard-related-achievement-line">
          Достижение: ${escapeHtml(item.achievementTitle || "без достижения")}
        </div>
      </div>

      <div class="dashboard-related-arrow" aria-hidden="true">›</div>
    </button>
  `;
}

function buildRelatedPlayerModalContent(player) {
  const charactersHtml = player.characters.length
    ? player.characters.map((character) => `
        <button
          class="related-character-chip"
          type="button"
          data-character-id="${character.id}"
          data-owner-label="${escapeHtml(player.playerName)}"
        >
          ${escapeHtml(character.name)} • ${escapeHtml(character.race || "—")} • ${escapeHtml(character.class_name || "—")}
        </button>
      `).join("")
    : `<div class="dashboard-related-meta">Персонажи не найдены</div>`;

  const achievementsHtml = player.achievements.length
    ? `
      <div class="related-achievements-preview">
        ${player.achievements.slice(0, 8).map((item) => `
          <div class="related-achievement-pill">${escapeHtml(item.title || "Достижение")}</div>
        `).join("")}
      </div>
    `
    : `<div class="dashboard-related-meta">Достижений пока нет</div>`;

  return `
    <div class="compact-related-modal-layout">
      <div class="character-view-section">
        <h4>${escapeHtml(player.playerName)}</h4>
        <p class="muted">Последняя общая сессия: ${escapeHtml(formatDate(player.lastSharedSessionDate))}</p>
      </div>

      <div class="character-view-section">
        <h4>Персонажи</h4>
        <div class="related-character-list">
          ${charactersHtml}
        </div>
      </div>

      <div class="character-view-section">
        <h4>Достижения</h4>
        ${achievementsHtml}
      </div>
    </div>
  `;
}

function bindRelatedModalCharacterClicks(onOpenAchievement) {
  document.querySelectorAll(".related-character-chip").forEach((button) => {
    button.addEventListener("click", async () => {
      await openReadOnlyCharacterModal({
        characterId: button.dataset.characterId,
        ownerLabel: button.dataset.ownerLabel || "",
        onOpenAchievement
      });
    });
  });
}

function ensureRelatedPlayerModal() {
  if ($("relatedPlayerDetailModal")) return;

  const modal = document.createElement("div");
  modal.id = "relatedPlayerDetailModal";
  modal.className = "modal hidden";
  modal.innerHTML = `
    <div class="modal-box small-modal-box">
      <div class="modal-header">
        <h3>Игрок</h3>
        <button id="closeRelatedPlayerDetailModalBtn" class="icon-button" type="button">✕</button>
      </div>
      <div id="relatedPlayerDetailContent"></div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("closeRelatedPlayerDetailModalBtn")?.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
}

function openRelatedPlayerModal(player, onOpenAchievement) {
  ensureRelatedPlayerModal();

  const content = $("relatedPlayerDetailContent");
  const modal = $("relatedPlayerDetailModal");
  if (!content || !modal) return;

  content.innerHTML = buildRelatedPlayerModalContent(player);
  modal.classList.remove("hidden");

  bindRelatedModalCharacterClicks(onOpenAchievement);
}

async function loadRelatedPlayersData(playerId) {
  const ownCharacterIds = await getCharacterIdsByPlayer(playerId);
  if (!ownCharacterIds.length) return { sessionDate: null, items: [], playersMap: new Map() };

  const sessions = await getUniqueSessionsByCharacterIds(ownCharacterIds);
  if (!sessions.length) return { sessionDate: null, items: [], playersMap: new Map() };

  const latestSession = sessions[0];
  if (!latestSession?.id) return { sessionDate: null, items: [], playersMap: new Map() };

  const { data, error } = await supabase
    .from("session_entries")
    .select(`
      session_id,
      character_id,
      achievement_title,
      characters (
        id,
        name,
        race,
        class_name,
        player_id,
        players (
          id,
          nickname,
          full_name,
          avatar_url
        )
      )
    `)
    .eq("session_id", latestSession.id);

  if (error) throw error;

  const items = [];
  const playersMap = new Map();

  for (const row of data || []) {
    const character = row.characters;
    const player = character?.players;

    if (!character?.id || !player?.id) continue;
    if (String(player.id) === String(playerId)) continue;
    if (ownCharacterIds.includes(character.id)) continue;

    const playerName = player.nickname || player.full_name || "Игрок";

    items.push({
      playerId: player.id,
      playerName,
      characterId: character.id,
      characterName: character.name || "Персонаж",
      achievementTitle: row.achievement_title || "без достижения",
      lastSharedSessionDate: latestSession.session_date || null
    });

    if (!playersMap.has(String(player.id))) {
      const achievements = await getAchievementsByPlayer(player.id);

      playersMap.set(String(player.id), {
        playerId: player.id,
        playerName,
        avatarUrl: player.avatar_url || "",
        lastSharedSessionDate: latestSession.session_date || null,
        characters: [],
        achievements: achievements || []
      });
    }

    const bucket = playersMap.get(String(player.id));
    if (!bucket.characters.find((item) => String(item.id) === String(character.id))) {
      bucket.characters.push({
        id: character.id,
        name: character.name || "Персонаж",
        race: character.race || "",
        class_name: character.class_name || ""
      });
    }
  }

  return {
    sessionDate: latestSession.session_date || null,
    items,
    playersMap
  };
}

function bindCompactRelatedRows(playersMap, onOpenAchievement) {
  document.querySelectorAll(".compact-related-row").forEach((button) => {
    button.addEventListener("click", () => {
      const player = playersMap.get(String(button.dataset.playerId));
      if (player) {
        openRelatedPlayerModal(player, onOpenAchievement);
      }
    });
  });
}

export async function renderRelatedPlayersScreen({
  playerId,
  onOpenAchievement
}) {
  const container = $("relatedPlayersList");
  if (!container) return;

  try {
    const { sessionDate, items, playersMap } = await loadRelatedPlayersData(playerId);

    if (!items.length) {
      container.innerHTML = renderRelatedEmptyState();
      return;
    }

    container.innerHTML = `
      <div class="related-session-head">
        <div class="dashboard-related-meta">
          Последняя общая сессия: ${escapeHtml(formatDate(sessionDate))}
        </div>
      </div>
      <div class="compact-related-list">
        ${items.slice(0, 8).map((item) => buildCompactRelatedRow(item)).join("")}
      </div>
    `;

    bindCompactRelatedRows(playersMap, onOpenAchievement);
  } catch (error) {
    console.error("Ошибка загрузки связанных игроков", error);
    container.innerHTML = renderRelatedEmptyState("Не удалось загрузить связанных игроков.");
  }
}