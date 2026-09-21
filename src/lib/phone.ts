/** Brazilian phone helpers for the public booking flow. */

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

/** "11999990000" -> "(11) 99999-0000" */
export function maskPhone(value: string): string {
  const digits = phoneDigits(value);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

export function isValidPhone(value: string): boolean {
  const digits = phoneDigits(value);
  return digits.length === 10 || digits.length === 11;
}
