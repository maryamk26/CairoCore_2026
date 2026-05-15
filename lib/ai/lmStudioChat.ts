import { getAiPlannerConfig } from "@/lib/ai/config";

export type LmStudioChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenAiChatResponse = {
  choices?: { message?: { content?: string | null } }[];
  error?: { message?: string };
};

export async function chatCompletionLmStudio(options: {
  messages: LmStudioChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}): Promise<string> {
  const cfg = getAiPlannerConfig();
  const model = cfg.lmStudioChatModel.trim();
  if (!model) {
    throw new Error("LM_STUDIO_CHAT_MODEL is not set");
  }

  const url = `${cfg.lmStudioBaseUrl}/chat/completions`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), cfg.chatTimeoutMs);

  const body: Record<string, unknown> = {
    model,
    messages: options.messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 4096,
  };
  if (options.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = (await res.json()) as OpenAiChatResponse;
    if (!res.ok) {
      throw new Error(data.error?.message ?? `LM Studio chat HTTP ${res.status}`);
    }
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("LM Studio chat returned empty content");
    }
    return content.trim();
  } finally {
    clearTimeout(t);
  }
}
