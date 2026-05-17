import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Key, Eye, EyeOff, Check, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { DashLayout } from "@/components/layout/DashLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useApiKey } from "@/lib/history";
import { testApiKey } from "@/lib/coachio";

export const Route = createFileRoute("/api-config")({
  component: ApiConfigPage,
});

function ApiConfigPage() {
  const [apiKey, setApiKey] = useApiKey();
  const [draft, setDraft] = useState(apiKey);
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  // keep draft in sync when persisted key loads
  if (draft === "" && apiKey && result === null) {
    setDraft(apiKey);
  }

  async function handleTest() {
    setTesting(true);
    setResult(null);
    const r = await testApiKey(draft.trim());
    setResult(r);
    setTesting(false);
    if (r.ok) toast.success(r.message);
    else toast.error(r.message);
  }

  function handleSave() {
    setApiKey(draft.trim());
    toast.success("Đã lưu API key vào trình duyệt");
  }

  return (
    <DashLayout
      title="Cấu hình API"
      description="Quản lý API key Coachio. Khoá được lưu cục bộ trong trình duyệt của bạn."
    >
      <div className="max-w-2xl space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="flex items-center gap-2">
            <Key className="size-4 text-primary" />
            <h3 className="text-sm font-bold">Coachio API Key</h3>
            {apiKey && (
              <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="size-3" /> Đã lưu
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">API key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={show ? "text" : "password"}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setResult(null);
                  }}
                  placeholder="lv_..."
                  className="pr-9 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Lấy API key tại dashboard Coachio (mục API Keys).
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              <Check className="size-4 mr-1.5" /> Lưu
            </Button>
            <Button
              variant="secondary"
              onClick={handleTest}
              disabled={testing || !draft.trim()}
              className="flex-1"
            >
              {testing ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" /> Đang kiểm tra...
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4 mr-1.5" /> Test kết nối
                </>
              )}
            </Button>
          </div>

          {result && (
            <div
              className={
                "rounded-lg p-3 text-sm flex items-start gap-2 " +
                (result.ok
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20")
              }
            >
              {result.ok ? (
                <ShieldCheck className="size-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
              )}
              <span>{result.message}</span>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-6">
          <h4 className="text-sm font-bold mb-2">Ghi chú bảo mật</h4>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
            <li>API key chỉ được lưu trong localStorage của trình duyệt này.</li>
            <li>Không gửi đến bất kỳ máy chủ nào ngoài Coachio.</li>
            <li>Xoá dữ liệu trình duyệt sẽ xoá luôn API key đã lưu.</li>
          </ul>
        </div>
      </div>
    </DashLayout>
  );
}
