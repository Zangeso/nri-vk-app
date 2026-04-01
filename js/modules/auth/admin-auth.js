import { supabase } from '../supabase.js';
import { showToast } from '../toast.js';

const ADMIN_STORAGE_KEY = "nri_admin_id";
const PLAYER_STORAGE_KEY = "nri_player_id";
const OWNER_MODE_KEY = "nri_owner_mode";

export function getAdminId() {
  return localStorage.getItem(ADMIN_STORAGE_KEY);
}

export function setAdminId(adminId) {
  if (!adminId) return;
  localStorage.setItem(ADMIN_STORAGE_KEY, adminId);
}

export function clearAdminId() {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
}

export async function adminLogin(code) {
  const normalizedCode = String(code || "").trim();

  if (!normalizedCode) {
    showToast("Введите код администратора", "error");
    return false;
  }

  const { data: admin, error } = await supabase
    .from("players")
    .select("id, role, login_code")
    .eq("login_code", normalizedCode)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    showToast("Ошибка входа: " + error.message, "error");
    return false;
  }

  if (!admin) {
    showToast("Администратор не найден", "error");
    return false;
  }

  setAdminId(admin.id);

  localStorage.setItem(PLAYER_STORAGE_KEY, admin.id);
  localStorage.setItem(OWNER_MODE_KEY, "1");

  showToast("Вход выполнен", "success");
  return true;
}