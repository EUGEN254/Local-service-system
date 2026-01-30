/**
 * Format Phone Helper
 * Formats and validates phone numbers
 */

export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  
  // Handle Kenyan numbers
  if (cleaned.startsWith("254")) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `+254${cleaned.slice(1)}`;
  }
  
  return phone;
};

export const isValidPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10;
};

export const displayPhoneNumber = (phone) => {
  const formatted = formatPhoneNumber(phone);
  // Display as: +254 7xx xxx xxx
  return formatted.replace(/(\+\d{3})(\d{2})(\d{3})(\d{3})/, "$1 $2$3 $4");
};
