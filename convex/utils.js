/**
 * Sanitizes strings to prevent basic XSS and other injection attacks.
 * Removes <script> tags and other potentially dangerous HTML.
 */
export function sanitizeString(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    .replace(/on\w+="[^"]*"/gim, "")
    .replace(/on\w+='[^']*'/gim, "")
    .replace(/javascript:[^\s"']*/gim, "")
    .trim();
}


/**
 * Validates a phone number (10 digits).
 */
export function validatePhone(phone) {
  if (!phone) return false;
  const clean = phone.replace(/\D/g, "");
  return clean.length === 10;
}

/**
 * Validates an email address.
 */
export function validateEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
