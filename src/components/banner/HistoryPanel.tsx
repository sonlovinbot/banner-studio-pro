import { History, Trash2, Clock } from "lucide-react";
import type { HistoryItem } from "@/lib/history";
import { Button } from "@/components/ui/button";

interface Props {
  items: HistoryItem[];
  onClear: () => void;
  onSelect: (item: HistoryItem) => void;
}

export function HistoryPanel({ items, onClear, onSelect }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-4 space-y-3">
      <div className="flex items-center gap-2">
        <History className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Lịch sử</h3>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="ml-auto h-7 px-2 text-xs"
          >
            <Trash2 className="size-3 mr-1" /> Xoá
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Chưa có lịch sử.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto -mr-2 pr-2">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => onSelect(it)}
              className="w-full text-left rounded-lg border border-border bg-background/60 hover:bg-accent transition-colors p-2.5"
            >
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
                <Clock className="size-3" />
                {new Date(it.createdAt).toLocaleString("vi-VN")}
                <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-primary">
                  {it.results.length}
                </span>
              </div>
              <p className="text-xs font-medium text-foreground truncate">
                {it.brand || it.prompt || "Banner"}
              </p>
              <div className="flex gap-1 mt-1.5">
                {it.results.slice(0, 5).map((r, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded border border-border overflow-hidden bg-muted"
                  >
                    <img src={r.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
