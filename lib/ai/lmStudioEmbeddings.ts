import { getAiPlannerConfig } from "@/lib/ai/config";

type OpenAiEmbeddingResponse = {
  data?: { embedding: number[]; index?: number }[];
  error?: { message?: string };
};

async function embedWithLmStudio(input: string | string[]): Promise<number[][]> {
  const cfg = getAiPlannerConfig();
  const url = `${cfg.lmStudioBaseUrl}/embeddings`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), cfg.timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: cfg.lmStudioEmbeddingModel,
        input,
      }),
      signal: controller.signal,
    });
    const body = (await res.json()) as OpenAiEmbeddingResponse;
    if (!res.ok) {
      throw new Error(body.error?.message ?? `LM Studio embeddings HTTP ${res.status}`);
    }
    const rows = body.data ?? [];
    const dim = cfg.embeddingDimensions;
    const out: number[][] = [];
    for (const row of rows.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))) {
      const emb = row.embedding;
      if (!Array.isArray(emb) || emb.length !== dim) {
        throw new Error(`Embedding dimension mismatch: got ${emb?.length}, expected ${dim}`);
      }
      out.push(emb);
    }
    if (out.length === 0) {
      throw new Error("LM Studio returned no embedding rows");
    }
    return out;
  } finally {
    clearTimeout(t);
  }
}

export async function embedSingleText(text: string): Promise<number[]> {
  const [first] = await embedWithLmStudio(text);
  if (!first) throw new Error("LM Studio returned empty embedding");
  return first;
}
