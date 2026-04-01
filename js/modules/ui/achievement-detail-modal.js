import { openModal } from './modal.js';
import { escapeHtml, cleanDisplayText } from '../utils.js';

const DEFAULT_ACHIEVEMENT_IMAGE = "https://placehold.co/500x500?text=Achievement";

function $(id) {
  return document.getElementById(id);
}

export function openAchievementDetailModal(data = {}) {
  if (!$("achievementDetailContent")) return;

  $("achievementDetailContent").innerHTML = `
    <div class="achievement-detail-layout">
      <img
        src="${escapeHtml(data.image || DEFAULT_ACHIEVEMENT_IMAGE)}"
        alt="achievement"
        class="story-cover"
        style="max-height:260px; margin-bottom:16px;"
      />

      <h3 style="margin:0 0 8px;">
        ${escapeHtml(data.title || "Достижение")}
      </h3>

      <p class="muted" style="margin:0 0 12px;">
        ${escapeHtml(data.character || "—")}
        ${data.player ? ` • ${escapeHtml(data.player)}` : ""}
      </p>

      <p style="margin:0; white-space:pre-line;">
        ${cleanDisplayText(data.description || "Описание не указано")}
      </p>
    </div>
  `;

  openModal("achievementDetailModal");
}