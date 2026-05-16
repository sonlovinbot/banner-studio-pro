import { useEffect, useState } from "react";

export interface HistoryItem {
  id: string;
  createdAt: number;
  brand: string;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  results: { style: string; url: string }[];
}

const KEY = "banner_history_v1";
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
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 50)));
}

export function addHistory(item: HistoryItem) {
  const cur = loadHistory();
  cur.unshift(item);
  saveHistory(cur);
}

export function clearHistory() {
  localStorage.removeItem(KEY);
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
  return { items, add, clear };
}
