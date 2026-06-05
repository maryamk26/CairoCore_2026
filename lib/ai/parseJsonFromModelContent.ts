function normalizeModelText(input: string): string {
  return (
    input
      .replace(/^\uFEFF/, "")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
  );
}

function stripTrailingCommas(jsonLike: string): string {
  return jsonLike.replace(/,\s*([}\]])/g, "$1");
}

function repairArrayObjectBoundaries(jsonLike: string): string {
  return jsonLike.replace(/}\s*{/g, "},{");
}

function pickBestJsonSegment(text: string): string | null {
  const segments: string[] = [];

  const scan = (open: "{" | "[", close: "}" | "]") => {
    let depth = 0;
    let start = -1;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === open) {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === close) {
        if (depth > 0) depth--;
        if (depth === 0 && start !== -1) {
          segments.push(text.slice(start, i + 1));
          start = -1;
        }
      }
    }
  };

  scan("{", "}");
  scan("[", "]");

  if (segments.length === 0) return null;

  const prefer = (s: string) =>
    s.includes('"assistantMessage"') ? 0 : s.includes('"tripProfile"') ? 1 : 2;

  segments.sort((a, b) => {
    const pa = prefer(a);
    const pb = prefer(b);
    if (pa !== pb) return pa - pb;
    return b.length - a.length;
  });

  return segments[0] ?? null;
}

function extractLikelyJsonPayload(text: string): string {
  const t = normalizeModelText(text).trim();

  const fenceAny = /```(?:json)?\s*([\s\S]*?)```/im.exec(t);
  const candidate = fenceAny ? fenceAny[1].trim() : t;

  const picked = pickBestJsonSegment(candidate);
  return picked ?? candidate;
}

function tryParseJson(raw: string): unknown {
  return JSON.parse(raw) as unknown;
}

export function parseJsonFromModelContent(content: string): unknown {
  const extracted = extractLikelyJsonPayload(content);

  const repairs = [
    (s: string) => s,
    stripTrailingCommas,
    (s: string) => repairArrayObjectBoundaries(stripTrailingCommas(s)),
  ];

  let lastError: unknown;
  for (const repair of repairs) {
    try {
      return tryParseJson(repair(extracted));
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}
