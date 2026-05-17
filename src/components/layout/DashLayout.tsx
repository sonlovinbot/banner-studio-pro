import { Link, useRouterState } from "@tanstack/react-router";
import { Wand2, Image as ImgIcon, Key, History, Sparkles, Bot } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

const NAV = [
  { to: "/", label: "Tổng quan", icon: Sparkles, exact: true },
  { to: "/studio", label: "Tạo Banner", icon: ImgIcon },
  { to: "/assistant", label: "Trợ lý AI", icon: Bot },
  { to: "/api-config", label: "Cấu hình API", icon: Key },
  { to: "/history", label: "Lịch sử", icon: History },
];

export function DashLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="min-h-screen bg-background flex">
      <Toaster position="top-right" />
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 size-[500px] rounded-full bg-pink-300/20 blur-3xl" />
        <div className="absolute top-40 -right-40 size-[500px] rounded-full bg-violet-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-[500px] rounded-full bg-blue-200/20 blur-3xl" />
      </div>

      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-card/70 backdrop-blur-xl flex flex-col">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border">
          <div
            className="size-9 rounded-lg flex items-center justify-center text-white shadow-md"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Wand2 className="size-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Banner Studio AI</h1>
            <p className="text-[10px] text-muted-foreground">GPT Image 2 · Coachio</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors " +
                  (active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground")
                }
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 text-[11px] text-muted-foreground border-t border-border">
          Dữ liệu lưu cục bộ trên trình duyệt của bạn.
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="h-16 px-8 flex items-center border-b border-border bg-background/60 backdrop-blur-xl sticky top-0 z-10">
          <div>
            <h2 className="text-base font-bold">{title}</h2>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
