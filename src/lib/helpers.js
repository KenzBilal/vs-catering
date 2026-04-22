export const ROLES = {
  service_boy: "Service Boy",
  service_girl: "Service Girl",
  captain_male: "Captain (Male)",
  captain_female: "Captain (Female)",
};

export const DRESS_CODE_DEFAULTS = {
  service_boy: "Black formal pants, formal shoes, clean shave. Black belt required. Shirt tucked in.",
  service_girl: "Black formal pants or skirt, formal shoes. Hair tied neatly in a bun or ponytail.",
  captain_male: "Full Suit: Black blazer, tie, white shirt, black formal pants, formal shoes, clean shave.",
  captain_female: "Full Suit: Black blazer, white shirt, black formal pants or skirt, formal shoes.",
};

export function getRoleLabel(role) {
  return ROLES[role] || role;
}

export function getTimeOfDayLabel(time) {
  const map = { day: "Day", night: "Night" };
  return map[time] || time;
}

export function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return "N/A";
  }
}

export function formatTime12h(timeStr) {
  if (!timeStr) return "";
  try {
    const [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours);
    const m = minutes;
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    return `${h.toString().padStart(2, "0")}:${m} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
}

export function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return "₹0";
  return `₹${amount}`;
}

export function generateWhatsAppMessage(catering, registrationUrl, siteName = "Catering") {
  const activeSlots = catering.slots.filter(s => Number(s.limit) > 0);
  
  const formatDateHeader = (dStr) => {
    if (!dStr) return "N/A";
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return "N/A";
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return `${d.getDate()}-${months[d.getMonth()]}`;
  };

  const headerDate = formatDateHeader(catering.date || (catering.dates && catering.dates[0]));

  const roles = activeSlots.map((s) => {
    const label = getRoleLabel(s.role);
    return `${label}: ${s.limit} required- ₹${s.pay}`;
  });


  let dressCode = catering.dressCodeNotes || "";
  ["Service Boy", "Service Girl", "Captain"].forEach(label => {
    const reg = new RegExp(`^${label}:`, 'gm');
    dressCode = dressCode.replace(reg, `*${label}:*`);
  });

  return `${siteName} — (${headerDate})

Place: ${catering.place}
Time: ${formatTime12h(catering.specificTime)} (${getTimeOfDayLabel(catering.timeOfDay)})
Pickup: Main Gate

Roles and Pay:
${roles.join("\n")}

Dress Code:
${dressCode}

Photo required: ${catering.photoRequired ? "Yes" : "No"}

Register here: ${registrationUrl}`;
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

// Validate Email format
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Validate Indian mobile: 10 digits, starting with 6–9
export function isValidPhone(phone) {
  if (!phone) return true; // Optional now
  return /^[6-9]\d{9}$/.test(phone.trim());
}

// Validate 8-digit LPU Reg Number, no trivial (11111111)
export function isValidRegNumber(reg) {
  if (!reg) return true;
  if (!/^\d{8}$/.test(reg)) return false;
  if (/^(\d)\1{7}$/.test(reg)) return false;
  return true;
}

/**
 * Unified error parser for Convex and general app errors.
 * Strips internal noise and provides user-friendly messages.
 */
export function parseError(e) {
  if (!e) return "Something went wrong.";

  // Network / fetch failure
  if (!navigator.onLine) return "You're offline. Check your connection and try again.";

  const raw = e.data || e.message || String(e);
  if (typeof raw !== "string") return "An unexpected error occurred.";

  // Strip Convex internal prefix: [CONVEX Q(...)] or [CONVEX M(...)]
  const stripped = raw.replace(/^\[CONVEX [A-Z]\([^)]+\)\]\s*/i, "").trim();

  if (stripped.includes("ConvexError:")) {
    return stripped.split("ConvexError:")[1].trim();
  }

  // Known network-level messages
  if (raw.includes("Failed to fetch") || raw.includes("NetworkError")) {
    return "Network error — couldn't reach the server. Please try again.";
  }
  if (raw.includes("timeout") || raw.includes("timed out")) {
    return "Request timed out. Please try again.";
  }

  return stripped || "An unexpected error occurred.";
}
