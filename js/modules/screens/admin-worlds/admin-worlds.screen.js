import { showToast } from '../../toast.js';
import { openModal, closeModal } from '../../ui/modal.js';
import { escapeHtml } from '../../utils.js';

import {
  getWorlds,
  getWorldById,
  createWorld,
  updateWorld,
  deleteWorld,
  getCampaignsByWorld,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign
} from '../../services/world.service.js';

let editingWorldId = null;
let editingCampaignId = null;
let currentCampaignWorldId = null;

function $(id) {
  return document.getElementById(id);
}

export async function loadWorldsWithCampaigns() {
  if (!$("worldsList")) return;

  try {
    const worlds = await getWorlds();

    if (!worlds.length) {
      $("worldsList").innerHTML = `<div class="card-item">Миров пока нет.</div>`;
      return;
    }

    const worldsWithCampaigns = await Promise.all(
      worlds.map(async (world) => {
        const campaigns = await getCampaignsByWorld(world.id);
        return { ...world, campaigns };
      })
    );

    $("worldsList").innerHTML = worldsWithCampaigns.map((world) => `
      <div class="card-item world-master-card">
        <div class="world-master-top">
          <div>
            <h4>${escapeHtml(world.title)}</h4>
            <p>${escapeHtml(world.description || "Без описания")}</p>
          </div>

          <div class="compact-session-admin-actions">
            <button class="icon-only-button edit-world-btn" data-id="${world.id}" type="button" title="Редактировать">✏</button>
            <button class="danger-action-icon-btn delete-world-btn" data-id="${world.id}" type="button" title="Удалить">🗑</button>
          </div>
        </div>

        <div class="world-campaigns-block">
          <div class="world-campaigns-head">
            <strong>Кампании</strong>
            <button class="small-button add-campaign-to-world-btn" data-id="${world.id}" type="button">Добавить кампанию</button>
          </div>

          ${
            world.campaigns.length
              ? `
                <div class="world-campaigns-list">
                  ${world.campaigns.map((campaign) => `
                    <div class="world-campaign-row">
                      <div>
                        <div class="world-campaign-title">${escapeHtml(campaign.title)}</div>
                        <div class="muted small-text">${escapeHtml(campaign.description || "Без описания")}</div>
                      </div>

                      <div class="compact-session-admin-actions">
                        <button class="icon-only-button edit-campaign-btn" data-id="${campaign.id}" type="button" title="Редактировать">✏</button>
                        <button class="danger-action-icon-btn delete-campaign-btn" data-id="${campaign.id}" type="button" title="Удалить">🗑</button>
                      </div>
                    </div>
                  `).join("")}
                </div>
              `
              : `<div class="muted small-text">Кампаний пока нет</div>`
          }
        </div>
      </div>
    `).join("");

    document.querySelectorAll(".edit-world-btn").forEach((btn) => {
      btn.addEventListener("click", () => openWorldModal(btn.dataset.id));
    });

    document.querySelectorAll(".delete-world-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteWorldHandler(btn.dataset.id));
    });

    document.querySelectorAll(".add-campaign-to-world-btn").forEach((btn) => {
      btn.addEventListener("click", () => openCampaignModal(null, btn.dataset.id));
    });

    document.querySelectorAll(".edit-campaign-btn").forEach((btn) => {
      btn.addEventListener("click", () => openCampaignModal(btn.dataset.id));
    });

    document.querySelectorAll(".delete-campaign-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteCampaignHandler(btn.dataset.id));
    });
  } catch (error) {
    showToast("Ошибка загрузки миров: " + error.message, "error");
  }
}

export async function loadWorldOptionsForAdmin() {
  const select = $("sessionWorld");
  if (!select) return;

  const worlds = await getWorlds();
  select.innerHTML =
    `<option value="">Выберите мир</option>` +
    worlds.map((w) => `<option value="${w.id}">${escapeHtml(w.title)}</option>`).join("");
}

export async function loadCampaignOptionsForAdmin(worldId) {
  const select = $("sessionCampaign");
  if (!select) return;

  if (!worldId) {
    select.innerHTML = `<option value="">Ваншот</option>`;
    select.disabled = true;
    return;
  }

  const campaigns = await getCampaignsByWorld(worldId);
  select.innerHTML =
    `<option value="">Ваншот</option>` +
    campaigns.map((c) => `<option value="${c.id}">${escapeHtml(c.title)}</option>`).join("");
  select.disabled = false;
}

function openWorldModal(worldId = null) {
  editingWorldId = worldId;
  $("worldModalTitle").textContent = worldId ? "Редактировать мир" : "Новый мир";
  $("worldTitle").value = "";
  $("worldDescription").value = "";
  openModal("worldModal");

  if (worldId) {
    loadWorldIntoModal(worldId);
  }
}

async function loadWorldIntoModal(worldId) {
  const world = await getWorldById(worldId);
  $("worldTitle").value = world.title || "";
  $("worldDescription").value = world.description || "";
}

async function saveWorld() {
  const title = $("worldTitle").value.trim();
  const description = $("worldDescription").value.trim();

  if (!title) {
    showToast("Введите название мира", "error");
    return;
  }

  try {
    if (editingWorldId) {
      await updateWorld(editingWorldId, title, description);
      showToast("Мир обновлён", "success");
    } else {
      await createWorld(title, description);
      showToast("Мир создан", "success");
    }

    closeModal("worldModal");
    await loadWorldsWithCampaigns();
    await loadWorldOptionsForAdmin();
  } catch (error) {
    showToast("Ошибка: " + error.message, "error");
  }
}

async function deleteWorldHandler(worldId) {
  if (!confirm("Удалить мир? Кампании этого мира тоже будут удалены.")) return;

  try {
    await deleteWorld(worldId);
    showToast("Мир удалён", "success");
    await loadWorldsWithCampaigns();
    await loadWorldOptionsForAdmin();
    await loadCampaignOptionsForAdmin(null);
  } catch (error) {
    showToast("Ошибка удаления: " + error.message, "error");
  }
}

function openCampaignModal(campaignId = null, worldId = null) {
  editingCampaignId = campaignId;
  currentCampaignWorldId = worldId || null;

  $("campaignModalTitle").textContent = campaignId ? "Редактировать кампанию" : "Новая кампания";
  $("campaignTitle").value = "";
  $("campaignDescription").value = "";

  openModal("campaignModal");

  if (campaignId) {
    loadCampaignIntoModal(campaignId);
  }
}

async function loadCampaignIntoModal(campaignId) {
  const campaign = await getCampaignById(campaignId);
  editingCampaignId = campaign.id;
  currentCampaignWorldId = campaign.world_id;
  $("campaignTitle").value = campaign.title || "";
  $("campaignDescription").value = campaign.description || "";
}

async function saveCampaign() {
  const title = $("campaignTitle").value.trim();
  const description = $("campaignDescription").value.trim();

  if (!currentCampaignWorldId) {
    showToast("Не выбран мир для кампании", "error");
    return;
  }

  if (!title) {
    showToast("Введите название кампании", "error");
    return;
  }

  try {
    if (editingCampaignId) {
      await updateCampaign(editingCampaignId, currentCampaignWorldId, title, description);
      showToast("Кампания обновлена", "success");
    } else {
      await createCampaign(currentCampaignWorldId, title, description);
      showToast("Кампания создана", "success");
    }

    closeModal("campaignModal");
    await loadWorldsWithCampaigns();

    if ($("sessionWorld")?.value === currentCampaignWorldId) {
      await loadCampaignOptionsForAdmin(currentCampaignWorldId);
    }
  } catch (error) {
    showToast("Ошибка: " + error.message, "error");
  }
}

async function deleteCampaignHandler(campaignId) {
  if (!confirm("Удалить кампанию?")) return;

  try {
    await deleteCampaign(campaignId);
    showToast("Кампания удалена", "success");
    await loadWorldsWithCampaigns();

    const currentWorldId = $("sessionWorld")?.value || null;
    await loadCampaignOptionsForAdmin(currentWorldId);
  } catch (error) {
    showToast("Ошибка удаления: " + error.message, "error");
  }
}

export function initAdminWorldsScreen() {
  $("openCreateWorldBtn")?.addEventListener("click", () => openWorldModal());
  $("closeWorldModalBtn")?.addEventListener("click", () => closeModal("worldModal"));
  $("saveWorldBtn")?.addEventListener("click", saveWorld);

  $("closeCampaignModalBtn")?.addEventListener("click", () => closeModal("campaignModal"));
  $("saveCampaignBtn")?.addEventListener("click", saveCampaign);

  $("sessionWorld")?.addEventListener("change", async (event) => {
    await loadCampaignOptionsForAdmin(event.target.value || null);
  });
}