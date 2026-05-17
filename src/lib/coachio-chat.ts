// Coachio Chat Completions — google/gemini-3.1-flash-lite
const BASE = "https://api.coachio.ai/api/v1";
export const CHAT_MODEL = "google/gemini-3.1-flash-lite";

export type ChatRole = "system" | "user" | "assistant";

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface ChatMessage {
  role: ChatRole;
  content: string | ContentPart[];
}

export interface StreamOpts {
  apiKey: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
  onUsage?: (usage: Record<string, number>) => void;
}

export async function streamChat(opts: StreamOpts): Promise<void> {
  const { apiKey, messages, temperature = 0.7, maxTokens = 2048, signal, onDelta, onUsage } = opts;
  if (!apiKey) throw new Error("Chưa cấu hình Coachio API key. Vào mục Cấu hình API để thêm.");

  const res = await fetch(`${BASE}/llm/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      stream: true,
      temperature,
      max_tokens: maxTokens,
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401) throw new Error("API key không hợp lệ (401).");
    if (res.status === 402) throw new Error("Tài khoản Coachio không đủ credits (402).");
    if (res.status === 429) throw new Error("Quá nhiều yêu cầu, vui lòng thử lại (429).");
    if (res.status === 400 && /too large/i.test(text)) throw new Error("Request quá lớn — hãy giảm kích thước media.");
    throw new Error(`Chat failed (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.body) throw new Error("No response body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line || !line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) onDelta(delta);
        if (json.usage && onUsage) onUsage(json.usage);
      } catch {
        /* ignore parse errors on partial chunks */
      }
    }
  }
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
