// js/admin.js
import {
  initAdminSessionsScreen,
  renderPublishedSessionsAdmin
} from './modules/screens/admin-sessions/admin-sessions.screen.js';
import { adminLogin, getAdminId } from './modules/auth/admin-auth.js';
import { showToast } from './modules/toast.js';
import { openModal, closeModal } from './modules/ui/modal.js';
import {
  loadWorldsWithCampaigns,
  loadWorldOptionsForAdmin,
  loadCampaignOptionsForAdmin,
  initAdminWorldsScreen
} from './modules/screens/admin-worlds/admin-worlds.screen.js';

import {
  initAdminParticipantsScreen,
  renderParticipantChips,
  getAdminParticipants,
  setAdminParticipants,
  resetAdminParticipants
} from './modules/screens/admin-participants/admin-participants.screen.js';
import { escapeHtml, formatDate, cleanDisplayText } from './modules/utils.js';

function $(id) {
return document.getElementById(id);
}


// ===== Общая загрузка =====
async function loadAdminData() {
await loadWorldsWithCampaigns();
await loadWorldOptionsForAdmin();
await loadCampaignOptionsForAdmin($("sessionWorld")?.value || null);
await renderPublishedSessionsAdmin();
renderParticipantChips();
}

function initTabs() {
document.querySelectorAll(".main-tab-button").forEach((button) => {
button.addEventListener("click", () => {
document.querySelectorAll(".main-tab-button").forEach((btn) => btn.classList.remove("active"));
document.querySelectorAll(".main-tab-panel").forEach((panel) => panel.classList.remove("active"));


  button.classList.add("active");
  const panelId = button.getAttribute("data-main-tab");
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add("active");
});


});
}

// ===== Init =====
async function initAdmin() {
const adminPanel = $("adminPanel");
if (!adminPanel) return;

initTabs();
initAdminWorldsScreen();
initAdminParticipantsScreen();
initAdminSessionsScreen();
await loadAdminData();

const adminId = getAdminId();
if (adminId) {
adminPanel.classList.remove("hidden");
await loadAdminData();
}

$("adminEnterBtn")?.addEventListener("click", async () => {
const code = $("adminLoginCode").value.trim();
const success = await adminLogin(code);


if (success) {
  adminPanel.classList.remove("hidden");
  await loadAdminData();
}


});




}

document.addEventListener("DOMContentLoaded", initAdmin);
