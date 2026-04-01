import { supabase } from '../supabase.js';

// ===== Worlds =====
export async function getWorlds() {
const { data, error } = await supabase
.from("worlds")
.select("*")
.order("created_at", { ascending: false });

if (error) throw error;
return data || [];
}

export async function getWorldById(worldId) {
const { data, error } = await supabase
.from("worlds")
.select("*")
.eq("id", worldId)
.single();

if (error) throw error;
return data;
}

export async function createWorld(title, description = "") {
const payload = {
title,
description: description || null
};

const { data, error } = await supabase
.from("worlds")
.insert([payload])
.select()
.single();

if (error) throw error;
return data;
}

export async function updateWorld(worldId, title, description = "") {
const payload = {
title,
description: description || null
};

const { data, error } = await supabase
.from("worlds")
.update(payload)
.eq("id", worldId)
.select()
.single();

if (error) throw error;
return data;
}

export async function deleteWorld(worldId) {
const { error } = await supabase
.from("worlds")
.delete()
.eq("id", worldId);

if (error) throw error;
}

// ===== Campaigns =====
export async function getCampaignsByWorld(worldId) {
const { data, error } = await supabase
.from("campaigns")
.select("*")
.eq("world_id", worldId)
.order("created_at", { ascending: false });

if (error) throw error;
return data || [];
}

export async function getCampaignById(campaignId) {
const { data, error } = await supabase
.from("campaigns")
.select("*")
.eq("id", campaignId)
.single();

if (error) throw error;
return data;
}

export async function createCampaign(worldId, title, description = "") {
const payload = {
world_id: worldId,
title,
description: description || null
};

const { data, error } = await supabase
.from("campaigns")
.insert([payload])
.select()
.single();

if (error) throw error;
return data;
}

export async function updateCampaign(campaignId, worldId, title, description = "") {
const payload = {
world_id: worldId,
title,
description: description || null
};

const { data, error } = await supabase
.from("campaigns")
.update(payload)
.eq("id", campaignId)
.select()
.single();

if (error) throw error;
return data;
}

export async function deleteCampaign(campaignId) {
const { error } = await supabase
.from("campaigns")
.delete()
.eq("id", campaignId);

if (error) throw error;
}
