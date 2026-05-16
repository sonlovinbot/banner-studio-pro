import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles, Wand2, Loader2, Image as ImgIcon, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiKeyField } from "@/components/banner/ApiKeyField";
import { ImageUploader } from "@/components/banner/ImageUploader";
import { HistoryPanel } from "@/components/banner/HistoryPanel";
import { ResultsGrid, type ResultSlot } from "@/components/banner/ResultsGrid";
import { useApiKey, useHistory, type HistoryItem } from "@/lib/history";
import { BANNER_STYLES, buildPrompt } from "@/lib/banner-styles";
import {
  uploadImage,
  submitTask,
  pollUntilDone,
  type AspectRatio,
  type Resolution,
} from "@/lib/coachio";

export const Route = createFileRoute("/")({
  component: BannerStudio,
});

function BannerStudio() {
  const [apiKey, setApiKey] = useApiKey();
  const { items, add, clear } = useHistory();

  const [inspiration, setInspiration] = useState<File[]>([]);
  const [product, setProduct] = useState<File[]>([]);
  const [brand, setBrand] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [aspect, setAspect] = useState<AspectRatio>("1:1");
  const [resolution, setResolution] = useState<Resolution>("1k");
  const [slots, setSlots] = useState<ResultSlot[]>([]);
  const [running, setRunning] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const canRun = useMemo(
    () => apiKey && (inspiration.length > 0 || product.length > 0) && !running,
    [apiKey, inspiration, product, running],
  );

  function updateSlot(i: number, patch: Partial<ResultSlot>) {
    setSlots((cur) => cur.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  async function handleGenerate() {
    if (!apiKey) {
      toast.error("Vui lòng nhập API key Coachio");
      return;
    }
    if (inspiration.length === 0 && product.length === 0) {
      toast.error("Hãy tải lên ít nhất một ảnh cảm hứng hoặc sản phẩm");
      return;
    }
    setRunning(true);
    const initial: ResultSlot[] = BANNER_STYLES.map((s) => ({
      style: s.name,
      status: "uploading",
    }));
    setSlots(initial);

    try {
      // Upload all images once
      toast.info("Đang tải ảnh lên Coachio...");
      const inspUrls = await Promise.all(
        inspiration.map((f) => uploadImage(apiKey, f)),
      );
      const prodUrls = await Promise.all(product.map((f) => uploadImage(apiKey, f)));
      const allUrls = [...inspUrls, ...prodUrls].slice(0, 10);
      setUploadedUrls(allUrls);

      const results: { style: string; url: string }[] = [];

      await Promise.all(
        BANNER_STYLES.map(async (style, i) => {
          try {
            updateSlot(i, { status: "submitting" });
            const prompt = buildPrompt({
              brand,
              userPrompt,
              styleModifier: style.modifier,
              hasInspiration: inspUrls.length > 0,
              hasProduct: prodUrls.length > 0,
            });
            const taskId = await submitTask({
              apiKey,
              prompt,
              aspectRatio: aspect,
              resolution,
              imageUrls: allUrls,
            });
            updateSlot(i, { status: "processing" });
            const urls = await pollUntilDone(apiKey, taskId);
            const url = urls[0];
            if (!url) throw new Error("Không có ảnh trả về");
            updateSlot(i, { status: "done", url });
            results.push({ style: style.name, url });
          } catch (err) {
            updateSlot(i, {
              status: "error",
              message: err instanceof Error ? err.message : "Lỗi",
            });
          }
        }),
      );

      if (results.length > 0) {
        const item: HistoryItem = {
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          brand,
          prompt: userPrompt,
          aspectRatio: aspect,
          resolution,
          results,
        };
        add(item);
        toast.success(`Đã tạo ${results.length}/5 banner`);
      } else {
        toast.error("Tạo banner thất bại");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setRunning(false);
    }
  }

  async function handleRegenerate(index: number, customPrompt: string) {
    if (!apiKey) {
      toast.error("Vui lòng nhập API key Coachio");
      return;
    }
    if (uploadedUrls.length === 0) {
      toast.error("Hãy chạy 'Tạo 5 banner' trước để tải ảnh lên");
      return;
    }
    const style = BANNER_STYLES[index];
    if (!style) return;
    updateSlot(index, { status: "submitting", url: undefined, message: undefined });
    try {
      const combinedPrompt = [userPrompt, customPrompt].filter(Boolean).join(". ");
      const prompt = buildPrompt({
        brand,
        userPrompt: combinedPrompt,
        styleModifier: style.modifier,
        hasInspiration: inspiration.length > 0,
        hasProduct: product.length > 0,
      });
      const taskId = await submitTask({
        apiKey,
        prompt,
        aspectRatio: aspect,
        resolution,
        imageUrls: uploadedUrls,
      });
      updateSlot(index, { status: "processing" });
      const urls = await pollUntilDone(apiKey, taskId);
      const url = urls[0];
      if (!url) throw new Error("Không có ảnh trả về");
      updateSlot(index, { status: "done", url });
      const item: HistoryItem = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        brand,
        prompt: combinedPrompt,
        aspectRatio: aspect,
        resolution,
        results: [{ style: style.name, url }],
      };
      add(item);
      toast.success(`Đã tạo lại "${style.name}"`);
    } catch (err) {
      updateSlot(index, {
        status: "error",
        message: err instanceof Error ? err.message : "Lỗi",
      });
      toast.error(err instanceof Error ? err.message : "Lỗi");
    }
  }

  function loadFromHistory(item: HistoryItem) {
    setBrand(item.brand);
    setUserPrompt(item.prompt);
    setSlots(
      item.results.map((r) => ({ style: r.style, status: "done", url: r.url })),
    );
    setAspect(item.aspectRatio as AspectRatio);
    setResolution(item.resolution as Resolution);
    toast.success("Đã tải lại từ lịch sử");
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 size-[500px] rounded-full bg-pink-300/30 blur-3xl" />
        <div className="absolute top-40 -right-40 size-[500px] rounded-full bg-violet-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-[500px] rounded-full bg-blue-200/30 blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center gap-3">
          <div
            className="size-9 rounded-lg flex items-center justify-center text-white shadow-md"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Wand2 className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">Banner Studio AI</h1>
            <p className="text-[11px] text-muted-foreground">
              Powered by GPT Image 2 · Coachio
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" />
            5 phong cách / lượt tạo
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 grid grid-cols-12 gap-6">
        {/* LEFT: Config */}
        <aside className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-4">
          <ApiKeyField value={apiKey} onChange={setApiKey} />

          <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-4 space-y-4">
            <div className="flex items-center gap-2">
              <ImgIcon className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">Tư liệu đầu vào</h3>
            </div>

            <ImageUploader
              label="Ảnh cảm hứng (Pinterest, mẫu poster)"
              description="Mẫu thiết kế tham khảo về bố cục, màu sắc"
              files={inspiration}
              onChange={setInspiration}
              max={3}
            />

            <ImageUploader
              label="Ảnh sản phẩm của bạn"
              description="Sản phẩm sẽ xuất hiện trong banner"
              files={product}
              onChange={setProduct}
              max={3}
            />
          </div>

          <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">Brand & Prompt</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Thông tin Brand</label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Tên brand, slogan, USP..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Prompt thay đổi (tuỳ chọn)
              </label>
              <Textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Ví dụ: nền màu hồng pastel, có dòng chữ 'SALE 50%'..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Tỷ lệ</label>
                <Select value={aspect} onValueChange={(v) => setAspect(v as AspectRatio)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">1:1 Vuông</SelectItem>
                    <SelectItem value="16:9">16:9 Ngang</SelectItem>
                    <SelectItem value="9:16">9:16 Dọc</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="3:4">3:4</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Chất lượng</label>
                <Select
                  value={resolution}
                  onValueChange={(v) => setResolution(v as Resolution)}
                  disabled={aspect === "auto"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1k">1K · 0.81 credit</SelectItem>
                    <SelectItem value="2k" disabled={aspect === "auto"}>
                      2K · 1.35 credit
                    </SelectItem>
                    <SelectItem value="4k" disabled={aspect === "auto" || aspect === "1:1"}>
                      4K · 3.2 credit
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {aspect === "auto" && (
              <p className="text-[11px] text-muted-foreground">
                Tỷ lệ Auto chỉ hỗ trợ 1K.
              </p>
            )}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!canRun}
            size="lg"
            className="w-full h-12 text-base font-semibold shadow-lg"
            style={{
              background: canRun ? "var(--gradient-brand)" : undefined,
              color: canRun ? "white" : undefined,
            }}
          >
            {running ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Đang tạo banner...
              </>
            ) : (
              <>
                <Sparkles className="size-4 mr-2" />
                Tạo 5 banner
              </>
            )}
          </Button>

          <HistoryPanel items={items} onClear={clear} onSelect={loadFromHistory} />
        </aside>

        {/* RIGHT: Results */}
        <section className="col-span-12 lg:col-span-8 xl:col-span-9">
          <div
            className="rounded-2xl border border-border bg-card/40 backdrop-blur p-6 min-h-[600px]"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold">Kết quả</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI tạo 5 phiên bản banner theo các phong cách khác nhau
                </p>
              </div>
              {running && (
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Loader2 className="size-3.5 animate-spin" />
                  Đang xử lý song song...
                </div>
              )}
            </div>
            <ResultsGrid slots={slots} />
          </div>
        </section>
      </main>
    </div>
  );
}
