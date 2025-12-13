export const formatPhone = (phone) => {
  if (!phone) return "";

  let str = phone.toString().trim().replace(/\D/g, ""); // remove spaces & non-digits

  // Remove leading 0 if present
  if (str.startsWith("0")) str = str.slice(1);

  // Remove leading 11 or invalid prefixes from older database entries
  if (str.length > 9 && str.startsWith("1")) str = str.slice(-9);

  // Ensure 9-digit starting with 7
  if (/^7\d{8}$/.test(str)) return "254" + str;

  // Ensure 9-digit starting with 1
  if (/^1\d{8}$/.test(str)) return "254" + str;

  // Already in 2547XXXXXXXX format
  if (/^2547\d{8}$/.test(str)) return str;

  // Already in 2541XXXXXXXX format
  if (/^2541\d{8}$/.test(str)) return str;

  // Invalid number fallback
  return "";
};
