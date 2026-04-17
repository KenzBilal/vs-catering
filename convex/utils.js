/**
 * Sanitizes strings to prevent basic XSS and other injection attacks.
 * Removes <script> tags and other potentially dangerous HTML.
 */
export function sanitizeString(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") // Remove scripts
    .replace(/on\w+="[^"]*"/gim, "") // Remove onmouseover, onclick, etc.
    .replace(/javascript:[^"]*/gim, "") // Remove javascript: links
    .trim();
}

/**
 * Validates a registration number (8 digits, no repeating all same digits).
 */
export function validateRegistrationNumber(regNum) {
  if (!regNum) return true; // Optional field
  if (!/^\d{8}$/.test(regNum)) return false;
  if (/^(\d)\1{7}$/.test(regNum)) return false; // Prevents 11111111, 22222222, etc.
  return true;
}

/**
 * Validates a phone number (10 digits).
 */
export function validatePhone(phone) {
  return /^\d{10}$/.test(phone);
}
