export function formatRelativeMonth(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const months = Math.floor((now.getTime() - date.getTime()) / (30 * 24 * 60 * 60 * 1000));

  if (months < 1) return "Just now";
  if (months === 1) return "1mo";
  return `${months}mo`;
}
