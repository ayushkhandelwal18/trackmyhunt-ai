// Date/time helpers for status details.
// Dates are stored as ISO values on the backend; all formatting happens here
// at display time. Date-only inputs ("YYYY-MM-DD") are parsed as local time
// so the displayed day never shifts with the viewer's timezone.

function pad(value) {
  return String(value).padStart(2, "0");
}

export function toDateInputValue(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateInput(value) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function formatShortDate(value) {
  const date = parseDateInput(value);
  if (!date) return "";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function formatLongDate(value) {
  const date = parseDateInput(value);
  if (!date) return "";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export function formatTime(value) {
  if (!value || typeof value !== "string") return "";
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  let hours = Number(match[1]);
  const minutes = match[2];
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${suffix}`;
}
