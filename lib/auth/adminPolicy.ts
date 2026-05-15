export const ADMIN_PRIMARY_EMAIL = "kfumaryam@gmail.com";

export function normalizeAdminEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isAdminEmail(value: string) {
  return normalizeAdminEmail(value) === ADMIN_PRIMARY_EMAIL;
}
