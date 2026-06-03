function normalizeModelText(input: string): string {
  // Normalize a few common “almost JSON” artifacts from LLMs.
  return (
    input
      .replace(/^\uFEFF/, "")
      // smart quotes → normal quotes
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      // remove ASCII control chars except \t \n \r
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
  );
}

function stripTrailingCommas(jsonLike: string): string {
  // Trailing commas are invalid JSON but common in model output.
  return jsonLike.replace(/,\s*([}\]])/g, "$1");
}

function pickBestJsonSegment(text: string): string | null {
  // Extract balanced {...} or [...] segments and pick the one
  // most likely to be the payload (prefer one containing assistantMessage).
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

  // Prefer a fenced json block anywhere in the content.
  const fenceAny = /```(?:json)?\s*([\s\S]*?)```/im.exec(t);
  const candidate = fenceAny ? fenceAny[1].trim() : t;

  // If not pure JSON, pick a balanced segment rather than slicing to lastIndexOf.
  const picked = pickBestJsonSegment(candidate);
  return picked ?? candidate;
}

function tryParseJson(raw: string): unknown {
  return JSON.parse(raw) as unknown;
}

export function parseJsonFromModelContent(content: string): unknown {
  const extracted = extractLikelyJsonPayload(content);

  // Attempt 1: raw parse.
  try {
    return tryParseJson(extracted);
  } catch {
    // Attempt 2: small repairs then parse.
    const repaired = stripTrailingCommas(extracted);
    return tryParseJson(repaired);
  }
}
