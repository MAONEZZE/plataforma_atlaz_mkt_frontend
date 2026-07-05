export function formatPhone(phone: string | null): string {
  if (!phone) return "—";
  return phone.startsWith("+") ? phone : `+${phone}`;
}
