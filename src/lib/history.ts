import { useEffect, useState } from "react";

export interface HistoryItem {
  id: string;
  createdAt: number;
  brand: string;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  model: string;
  inspirationThumbs: string[]; // data URLs (compressed thumbnails)
  productThumbs: string[];
  results: { style: string; url: string }[];
}

const KEY = "banner_history_v2";
const API_KEY = "banner_api_key_v1";

export function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, 50)));
  } catch {
    // quota exceeded — drop oldest
    try {
      localStorage.setItem(KEY, JSON.stringify(items.slice(0, 20)));
    } catch {
      /* ignore */
    }
  }
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}

export function removeHistoryItem(id: string) {
  const next = loadHistory().filter((i) => i.id !== id);
  saveHistory(next);
}

export function useApiKey() {
  const [key, setKey] = useState("");
  useEffect(() => {
    setKey(localStorage.getItem(API_KEY) || "");
  }, []);
  const update = (v: string) => {
    setKey(v);
    localStorage.setItem(API_KEY, v);
  };
  return [key, update] as const;
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  useEffect(() => {
    setItems(loadHistory());
  }, []);
  const add = (item: HistoryItem) => {
    const next = [item, ...items].slice(0, 50);
    setItems(next);
    saveHistory(next);
  };
  const clear = () => {
    setItems([]);
    clearHistory();
  };
  const remove = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    saveHistory(next);
  };
  return { items, add, clear, remove };
}

/** Compress an image File to a small data URL (max ~400px, JPEG q=0.7) for storage. */
export async function fileToThumbnail(file: File, max = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas ctx"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
