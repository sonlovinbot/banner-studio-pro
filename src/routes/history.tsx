import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Clock, Download, X, Building2, Settings2, Image as ImgIcon } from "lucide-react";
import { DashLayout } from "@/components/layout/DashLayout";
import { Button } from "@/components/ui/button";
import { useHistory, type HistoryItem } from "@/lib/history";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { items, clear, remove } = useHistory();
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  return (
    <DashLayout
      title="Lịch sử"
      description={`${items.length} lần chạy được lưu cục bộ kèm ảnh đầu vào, brand, cấu hình và kết quả.`}
    >
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">
          Nhấn vào một mục để xem chi tiết cấu hình và kết quả.
        </p>
        {items.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("Xoá toàn bộ lịch sử?")) clear();
            }}
          >
            <Trash2 className="size-3.5 mr-1.5" /> Xoá tất cả
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <Clock className="size-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Chưa có lịch sử nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => setSelected(it)}
              className="text-left rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <div className="grid grid-cols-3 gap-px bg-border aspect-[3/2]">
                {it.results.slice(0, 3).map((r, i) => (
                  <div key={i} className="bg-muted overflow-hidden">
                    <img src={r.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 3 - it.results.length) }).map((_, i) => (
                  <div key={`e${i}`} className="bg-muted/50 flex items-center justify-center">
                    <ImgIcon className="size-5 text-muted-foreground/40" />
                  </div>
                ))}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
                  <Clock className="size-3" />
                  {new Date(it.createdAt).toLocaleString("vi-VN")}
                  <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-primary text-[10px] font-semibold">
                    {it.results.length} ảnh
                  </span>
                </div>
                <p className="text-sm font-semibold truncate">
                  {it.brand || it.prompt || "Banner"}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                  <span>{it.model}</span>
                  <span>·</span>
                  <span>{it.aspectRatio}</span>
                  <span>·</span>
                  <span>{it.resolution}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <DetailModal item={selected} onClose={() => setSelected(null)} onDelete={() => { remove(selected.id); setSelected(null); }} />
      )}
    </DashLayout>
  );
}

function DetailModal({ item, onClose, onDelete }: { item: HistoryItem; onClose: () => void; onDelete: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-background rounded-2xl border border-border max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-6 py-4 flex items-center gap-3 z-10">
          <div>
            <h3 className="font-bold text-base">Chi tiết lần chạy</h3>
            <p className="text-xs text-muted-foreground">
              {new Date(item.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="size-3.5 mr-1.5" /> Xoá
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Config */}
          <section className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="size-4 text-primary" />
                <h4 className="text-sm font-bold">Brand & Prompt</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Brand:</span>
                  <p className="whitespace-pre-wrap">{item.brand || <em className="text-muted-foreground">—</em>}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Prompt:</span>
                  <p className="whitespace-pre-wrap">{item.prompt || <em className="text-muted-foreground">—</em>}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="size-4 text-primary" />
                <h4 className="text-sm font-bold">Cấu hình</h4>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-xs text-muted-foreground">Model</dt>
                <dd className="font-mono text-xs">{item.model}</dd>
                <dt className="text-xs text-muted-foreground">Tỷ lệ</dt>
                <dd>{item.aspectRatio}</dd>
                <dt className="text-xs text-muted-foreground">Chất lượng</dt>
                <dd>{item.resolution}</dd>
              </dl>
            </div>
          </section>

          {/* Inputs */}
          {(item.inspirationThumbs.length > 0 || item.productThumbs.length > 0) && (
            <section className="space-y-3">
              <h4 className="text-sm font-bold">Ảnh đầu vào</h4>
              {item.inspirationThumbs.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Cảm hứng ({item.inspirationThumbs.length})</p>
                  <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
                    {item.inspirationThumbs.map((src, i) => (
                      <div key={i} className="aspect-square rounded-lg border border-border overflow-hidden bg-muted">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {item.productThumbs.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Sản phẩm ({item.productThumbs.length})</p>
                  <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
                    {item.productThumbs.map((src, i) => (
                      <div key={i} className="aspect-square rounded-lg border border-border overflow-hidden bg-muted">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Results */}
          <section>
            <h4 className="text-sm font-bold mb-3">Kết quả ({item.results.length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {item.results.map((r, i) => (
                <div key={i} className="rounded-xl border border-border bg-card overflow-hidden group">
                  <div className="aspect-square bg-muted relative">
                    <img src={r.url} alt={r.style} className="w-full h-full object-cover" />
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="absolute top-2 right-2 size-8 rounded-full bg-background/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="size-4" />
                    </a>
                  </div>
                  <div className="p-2.5 text-xs font-semibold">{r.style}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
