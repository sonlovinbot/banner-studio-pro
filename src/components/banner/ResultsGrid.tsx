import { useState } from "react";
import { Download, Loader2, ImageOff, Sparkles, RefreshCw, Wand2 } from "lucide-react";
import { BANNER_STYLES } from "@/lib/banner-styles";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface ResultSlot {
  style: string;
  status: "idle" | "uploading" | "submitting" | "processing" | "done" | "error";
  url?: string;
  message?: string;
}

interface Props {
  slots: ResultSlot[];
  onRegenerate?: (index: number, customPrompt: string) => void;
}

const labels: Record<ResultSlot["status"], string> = {
  idle: "Đang chờ",
  uploading: "Tải ảnh lên...",
  submitting: "Gửi yêu cầu...",
  processing: "AI đang tạo...",
  done: "Hoàn thành",
  error: "Lỗi",
};

export function ResultsGrid({ slots, onRegenerate }: Props) {
  const display: ResultSlot[] = slots.length
    ? slots
    : BANNER_STYLES.map((s) => ({ style: s.name, status: "idle" }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {display.map((slot, i) => (
        <ResultCard
          key={i}
          slot={slot}
          onRegenerate={onRegenerate ? (p) => onRegenerate(i, p) : undefined}
        />
      ))}
    </div>
  );
}

function ResultCard({
  slot,
  onRegenerate,
}: {
  slot: ResultSlot;
  onRegenerate?: (prompt: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const busy =
    slot.status === "uploading" || slot.status === "submitting" || slot.status === "processing";

  return (
    <div
      className="group relative rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col"
      style={{ boxShadow: slot.status === "done" ? "var(--shadow-soft)" : undefined }}
    >
      <div className="aspect-square bg-gradient-to-br from-muted to-muted/40 flex items-center justify-center relative">
        {slot.url ? (
          <img src={slot.url} alt={slot.style} className="w-full h-full object-cover" />
        ) : slot.status === "error" ? (
          <div className="text-center px-4">
            <ImageOff className="size-8 mx-auto text-destructive mb-2" />
            <p className="text-xs text-destructive">{slot.message || "Lỗi"}</p>
          </div>
        ) : slot.status === "idle" ? (
          <div className="text-center text-muted-foreground">
            <Sparkles className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Chờ tạo</p>
          </div>
        ) : (
          <div className="text-center">
            <Loader2 className="size-8 mx-auto text-primary animate-spin mb-2" />
            <p className="text-xs text-muted-foreground">{labels[slot.status]}</p>
          </div>
        )}
        {slot.url && (
          <a
            href={slot.url}
            target="_blank"
            rel="noreferrer"
            download
            className="absolute top-2 right-2 size-9 rounded-full bg-background/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          >
            <Download className="size-4" />
          </a>
        )}
      </div>
      <div className="p-3 flex items-center justify-between">
        <span className="text-sm font-semibold">{slot.style}</span>
        <span
          className={
            "text-[10px] uppercase tracking-wide font-medium rounded-full px-2 py-0.5 " +
            (slot.status === "done"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : slot.status === "error"
                ? "bg-destructive/15 text-destructive"
                : slot.status === "idle"
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/15 text-primary")
          }
        >
          {labels[slot.status]}
        </span>
      </div>
      {onRegenerate && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/60 pt-3">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Wand2 className="size-3" />
            Tuỳ chỉnh riêng cho bản này
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ví dụ: đổi nền xanh, thêm chữ 'SALE 50%'..."
            rows={2}
            className="text-xs resize-none"
            disabled={busy}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => onRegenerate(prompt)}
            className="w-full h-8 text-xs"
          >
            {busy ? (
              <>
                <Loader2 className="size-3 mr-1.5 animate-spin" />
                Đang tạo lại...
              </>
            ) : (
              <>
                <RefreshCw className="size-3 mr-1.5" />
                Tạo lại bản này
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
