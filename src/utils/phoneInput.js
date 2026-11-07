/** Keep public Indian phone fields to ten numeric digits. */
export function limitPhoneDigits(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  const nationalNumber = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return nationalNumber.slice(0, 10);
}
