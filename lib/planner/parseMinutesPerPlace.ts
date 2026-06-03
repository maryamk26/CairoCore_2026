export const MINUTES_PER_PLACE_CHIPS: Record<string, number> = {
  "30 min / place": 30,
  "1 hour / place": 60,
  "1.5 hours / place": 90,
  "2 hours / place": 120,
};

export function minutesPerPlaceFromQuickReplyChip(message: string): number | undefined {
  const t = message.trim();
  const direct = MINUTES_PER_PLACE_CHIPS[t];
  if (direct) return direct;
  return parseMinutesPerPlaceFromText(t);
}

export function parseMinutesPerPlaceFromText(text: string): number | undefined {
  const t = text.trim().toLowerCase();
  if (!t) return undefined;

  const chip = MINUTES_PER_PLACE_CHIPS[text.trim()];
  if (chip) return chip;

  const hourPerPlace = t.match(
    /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\s*(?:per place|each place|at each|per stop|each stop|a place)?/
  );
  if (hourPerPlace) {
    const hours = parseFloat(hourPerPlace[1]!);
    if (Number.isFinite(hours) && hours > 0 && hours <= 8) {
      return Math.round(hours * 60);
    }
  }

  const minPerPlace = t.match(
    /(\d+)\s*(?:minutes?|mins?)\s*(?:per place|each place|at each|per stop|each stop|a place)?/
  );
  if (minPerPlace) {
    const mins = parseInt(minPerPlace[1]!, 10);
    if (mins >= 15 && mins <= 480) return mins;
  }

  if (/^(half an hour|30 min)/i.test(t)) return 30;
  if (/^1\.5\s*hours?/i.test(t)) return 90;
  if (/^2\s*hours?/i.test(t)) return 120;
  if (/^1\s*hours?/i.test(t)) return 60;

  return undefined;
}
