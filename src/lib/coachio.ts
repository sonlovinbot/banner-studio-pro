const BASE = "https://api.coachio.ai/api/v1";

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "auto";
export type Resolution = "1k" | "2k" | "4k";

export interface SubmitParams {
  apiKey: string;
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  imageUrls: string[];
}

export async function uploadImage(apiKey: string, file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}/upload/image`, {
    method: "POST",
    headers: { "X-API-Key": apiKey },
    body: fd,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.url as string;
}

export async function submitTask(p: SubmitParams): Promise<string> {
  const resolution = p.aspectRatio === "auto" ? "1k" : p.resolution;
  const body: Record<string, unknown> = {
    task_type: "image",
    prompt: p.prompt,
    ai_model_config: {
      model_identifier: "gpt_image_2",
      generation_mode: "default",
      aspect_ratio: p.aspectRatio,
      resolution,
    },
  };
  if (p.imageUrls.length > 0) {
    body.media_inputs = { images_url: p.imageUrls };
  }
  const res = await fetch(`${BASE}/task/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": p.apiKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Submit failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.task_id as string;
}

export interface TaskStatus {
  task_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  result_urls?: string[];
  result?: { output_urls?: string[] };
  message?: string;
}

export async function getStatus(apiKey: string, taskId: string): Promise<TaskStatus> {
  const res = await fetch(`${BASE}/task/status/${taskId}`, {
    headers: { "X-API-Key": apiKey },
  });
  if (!res.ok) throw new Error(`Status failed (${res.status})`);
  return res.json();
}

export async function pollUntilDone(
  apiKey: string,
  taskId: string,
  onTick?: (s: TaskStatus) => void,
  timeoutMs = 5 * 60 * 1000,
): Promise<string[]> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const s = await getStatus(apiKey, taskId);
    onTick?.(s);
    if (s.status === "completed") {
      return s.result_urls ?? s.result?.output_urls ?? [];
    }
    if (s.status === "failed") {
      throw new Error(s.message || "Task failed");
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("Task timed out");
}

/** Verify the API key is valid by hitting a protected endpoint. */
export async function testApiKey(apiKey: string): Promise<{ ok: boolean; message: string }> {
  if (!apiKey.trim()) return { ok: false, message: "Chưa nhập API key" };
  try {
    // Use a random invalid task id: 401/403 = bad key, 404 = key works.
    const res = await fetch(`${BASE}/task/status/__ping_${Date.now()}`, {
      headers: { "X-API-Key": apiKey },
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: `API key không hợp lệ (${res.status})` };
    }
    return { ok: true, message: "API key hợp lệ ✓" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Network error" };
  }
}
