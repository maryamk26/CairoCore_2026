export type WorkingHoursState = Record<
  string,
  { start: string; end: string } | "closed"
>;
