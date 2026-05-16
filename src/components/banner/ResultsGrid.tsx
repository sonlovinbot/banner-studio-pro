import { Download, Loader2, ImageOff, Sparkles } from "lucide-react";
import { BANNER_STYLES } from "@/lib/banner-styles";

export interface ResultSlot {
  style: string;
  status: "idle" | "uploading" | "submitting" | "processing" | "done" | "error";
  url?: string;
  message?: string;
}

interface Props {
  slots: ResultSlot[];
}

const labels: Record<ResultSlot["status"], string> = {
  idle: "Đang chờ",
  uploading: "Tải ảnh lên...",
  submitting: "Gửi yêu cầu...",
  processing: "AI đang tạo...",
  done: "Hoàn thành",
  error: "Lỗi",
};

export function ResultsGrid({ slots }: Props) {
  const display: ResultSlot[] = slots.length
    ? slots
    : BANNER_STYLES.map((s) => ({ style: s.name, status: "idle" }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {display.map((slot, i) => (
        <div
          key={i}
          className="group relative rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all"
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
        </div>
      ))}
    </div>
  );
}
