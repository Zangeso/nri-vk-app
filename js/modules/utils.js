export function escapeHtml(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;")
    .split("'").join("&#39;");
}

export function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("ru-RU");
}

export function truncateText(text, maxLength = 110) {
  if (!text) return "Без описания";

  const normalized = String(text);
  if (normalized.length <= maxLength) return normalized;

  return normalized.slice(0, maxLength).trim() + "…";
}

export function getFileExtension(fileName) {
  if (!fileName) return "";

  const parts = String(fileName).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

export function cleanDisplayText(value) {
  if (value === null || value === undefined) return "";

  let text = String(value);

  text = text.split("```").join("");
  text = text.split("`").join("");

  text = text.split("<br>").join("\n");
  text = text.split("<br/>").join("\n");
  text = text.split("<br />").join("\n");

  while (text.indexOf("\n\n\n") !== -1) {
    text = text.split("\n\n\n").join("\n\n");
  }

  return escapeHtml(text).trim();
}