import { createFileRoute, Link } from "@tanstack/react-router";
import { Image as ImgIcon, Key, History, ArrowRight, Sparkles } from "lucide-react";
import { DashLayout } from "@/components/layout/DashLayout";
import { useHistory, useApiKey } from "@/lib/history";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { items } = useHistory();
  const [apiKey] = useApiKey();

  const cards = [
    {
      to: "/studio",
      title: "Tạo Banner",
      desc: "Mở studio toàn màn hình để upload ảnh cảm hứng & sản phẩm, AI tạo 5 phiên bản.",
      icon: ImgIcon,
      cta: "Bắt đầu tạo",
      accent: "var(--gradient-brand)",
    },
    {
      to: "/api-config",
      title: "Cấu hình API",
      desc: apiKey
        ? "API key đã được lưu. Bạn có thể kiểm tra hoặc cập nhật."
        : "Chưa có API key. Hãy thêm để bắt đầu.",
      icon: Key,
      cta: apiKey ? "Quản lý" : "Thêm API key",
      accent: undefined,
    },
    {
      to: "/history",
      title: "Lịch sử",
      desc: `${items.length} lần chạy được lưu cục bộ, kèm đầy đủ cấu hình và kết quả.`,
      icon: History,
      cta: "Xem lịch sử",
      accent: undefined,
    },
  ];

  return (
    <DashLayout
      title="Tổng quan"
      description="Chọn một mục để bắt đầu hoặc xem lại công việc của bạn."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.to}
              to={c.to}
              className="group rounded-2xl border border-border bg-card p-6 hover:shadow-xl transition-all hover:-translate-y-0.5"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <div
                className="size-12 rounded-xl flex items-center justify-center text-white mb-4"
                style={{
                  background:
                    c.accent ?? "linear-gradient(135deg, oklch(0.6 0.05 280), oklch(0.4 0.05 280))",
                }}
              >
                <Icon className="size-6" />
              </div>
              <h3 className="text-lg font-bold mb-1.5">{c.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">{c.desc}</p>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                {c.cta}
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 max-w-5xl rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-4 text-primary" />
          <h3 className="text-sm font-bold">Quy trình 3 bước</h3>
        </div>
        <ol className="grid md:grid-cols-3 gap-4 text-sm">
          {[
            "Lưu API key Coachio ở mục Cấu hình API.",
            "Mở Studio, upload ảnh cảm hứng & ảnh sản phẩm, điền brief brand.",
            "Nhấn Tạo banner — kết quả tự động lưu vào lịch sử.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="size-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </DashLayout>
  );
}
