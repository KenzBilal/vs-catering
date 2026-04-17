export const ROLES = {
  service_boy: "Service Boy",
  service_girl: "Service Girl",
  captain_male: "Captain",
};

export const DRESS_CODE_DEFAULTS = {
  service_boy: "Black formal pants, formal shoes, clean shave. Short or long hair is acceptable.",
  service_girl: "Black formal pants or skirt, formal shoes.",
  captain_male: "Black blazer, tie, white shirt, black formal pants, formal shoes, clean shave. Short or long hair is acceptable.",
};

export function getRoleLabel(role) {
  return ROLES[role] || role;
}

export function getTimeOfDayLabel(time) {
  const map = { day: "Day", night: "Night" };
  return map[time] || time;
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatCurrency(amount) {
  return `₹${amount}`;
}

export function generateWhatsAppMessage(catering, registrationUrl) {
  const roles = catering.slots.map((s) => {
    const label = getRoleLabel(s.role);
    const dayLabel = catering.isTwoDay ? ` (Day ${s.day + 1})` : "";
    return `${label}${dayLabel}: ${s.limit} required — ${formatCurrency(s.pay)} per person`;
  });

  const dateStr = catering.isTwoDay
    ? `${formatDate(catering.dates[0])} and ${formatDate(catering.dates[1])}`
    : formatDate(catering.dates[0]);

  return `Catering — New Work Posted

Place: ${catering.place}
Date: ${dateStr}
Time: ${catering.specificTime} (${getTimeOfDayLabel(catering.timeOfDay)})
Pickup: Main Gate

Roles and Pay:
${roles.join("\n")}

Dress Code:
${catering.dressCodeNotes}

Photo required: ${catering.photoRequired ? "Yes" : "No"}

Register here: ${registrationUrl}

Register on the website to confirm your spot. First ${Math.min(...catering.slots.map((s) => s.limit))} per role are confirmed. Others go on waiting list.`;
}

export function getStatusBadgeClass(status) {
  const map = {
    upcoming: "badge-upcoming",
    today: "badge-today",
    tomorrow: "badge-tomorrow",
    ended: "badge-ended",
    cancelled: "badge-cancelled",
  };
  return map[status] || "badge-ended";
}

export function getStatusLabel(status) {
  const map = {
    upcoming: "Upcoming",
    today: "Today",
    tomorrow: "Tomorrow",
    ended: "Ended",
    cancelled: "Cancelled",
  };
  return map[status] || status;
}

// Validate Indian mobile: 10 digits, starting with 6–9
export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.trim());
}
