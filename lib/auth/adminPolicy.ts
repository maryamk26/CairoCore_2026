function adminEmailFromEnv(): string {
  const raw = process.env.ADMIN_EMAIL?.trim();
  return raw ? raw.toLowerCase() : "";
}

export function getAdminEmail(): string {
  return adminEmailFromEnv();
}

export function normalizeAdminEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isAdminEmail(value: string) {
  const admin = adminEmailFromEnv();
  if (!admin) return false;
  return normalizeAdminEmail(value) === admin;
}
