import { useState } from "react";
import { Key, Eye, EyeOff, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function ApiKeyField({ value, onChange }: Props) {
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Key className="size-4 text-primary" />
        <label className="text-sm font-semibold">Coachio API Key</label>
        {value && (
          <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Check className="size-3" /> đã lưu
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={show ? "text" : "password"}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setSaved(false);
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
        <Button
          type="button"
          size="sm"
          onClick={() => {
            onChange(draft.trim());
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          }}
        >
          {saved ? "Đã lưu" : "Lưu"}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Khoá được lưu cục bộ trên trình duyệt (localStorage).
      </p>
    </div>
  );
}
