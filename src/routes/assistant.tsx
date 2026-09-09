import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, User, Send, Square, Image as ImgIcon, X, Trash2, Sparkles } from "lucide-react";
import { DashLayout } from "@/components/layout/DashLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useApiKey } from "@/lib/history";
import {
  streamChat,
  fileToDataUrl,
  type ChatMessage,
  type ContentPart,
  CHAT_MODEL,
} from "@/lib/coachio-chat";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function MarkdownBubble({ text }: { text: string }) {
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none leading-relaxed
      prose-headings:mt-3 prose-headings:mb-2 prose-headings:font-semibold
      prose-h1:text-base prose-h2:text-[15px] prose-h3:text-sm
      prose-p:my-2 prose-p:leading-relaxed
      prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-li:marker:text-primary
      prose-strong:text-foreground prose-strong:font-semibold
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.85em] prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-foreground/5 prose-pre:border prose-pre:border-border prose-pre:rounded-lg
      prose-blockquote:border-l-primary/50 prose-blockquote:text-muted-foreground prose-blockquote:not-italic
      prose-hr:my-3 prose-table:text-xs"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

export const Route = createFileRoute("/assistant")({
  component: AssistantPage,
});

interface UIMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  images?: string[];
  error?: boolean;
}

const SYSTEM_PROMPT =
  "Bạn là Trợ lý AI cho doanh nghiệp. Trả lời ngắn gọn, chuyên nghiệp, định dạng markdown khi cần. Hỗ trợ marketing, vận hành, khách hàng, phân tích dữ liệu, ý tưởng nội dung.";

const SUGGESTIONS = [
  "Viết caption Facebook quảng bá sản phẩm mới",
  "Lập kế hoạch nội dung 7 ngày cho thương hiệu cà phê",
  "Phân tích SWOT cho cửa hàng thời trang online",
  "Soạn email chăm sóc khách hàng sau mua hàng",
];

const STORAGE_KEY = "assistant_chat_v1";

function AssistantPage() {
  const [apiKey] = useApiKey();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Restore
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  // Focus
  useEffect(() => {
    if (!streaming) taRef.current?.focus();
  }, [streaming]);

  const onPickImages = async (files: FileList | null) => {
    if (!files) return;
    const arr: string[] = [];
    for (const f of Array.from(files).slice(0, 4)) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} quá lớn (>5MB)`);
        continue;
      }
      if (!/^image\/(png|jpeg|webp|gif)$/.test(f.type)) {
        toast.error(`${f.name}: chỉ hỗ trợ PNG/JPEG/WEBP/GIF`);
        continue;
      }
      arr.push(await fileToDataUrl(f));
    }
    setImages((p) => [...p, ...arr].slice(0, 4));
  };

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text && images.length === 0) return;
    if (!apiKey) {
      toast.error("Chưa có API key. Vào Cấu hình API để thêm.");
      return;
    }

    const userMsg: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      images: images.length ? [...images] : undefined,
    };
    const assistantMsg: UIMessage = { id: crypto.randomUUID(), role: "assistant", text: "" };
    const next = [...messages, userMsg, assistantMsg];
    setMessages(next);
    setInput("");
    setImages([]);
    setStreaming(true);

    // Build API messages
    const apiMessages: ChatMessage[] = [{ role: "system", content: SYSTEM_PROMPT }];
    for (const m of next) {
      if (m.id === assistantMsg.id) break;
      if (m.role === "user" && m.images?.length) {
        const parts: ContentPart[] = [];
        if (m.text) parts.push({ type: "text", text: m.text });
        for (const url of m.images) parts.push({ type: "image_url", image_url: { url } });
        apiMessages.push({ role: "user", content: parts });
      } else {
        apiMessages.push({ role: m.role, content: m.text });
      }
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      await streamChat({
        apiKey,
        messages: apiMessages,
        signal: ctrl.signal,
        onDelta: (chunk) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsg.id ? { ...m, text: m.text + chunk } : m)),
          );
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi không xác định";
      if (ctrl.signal.aborted) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, text: m.text + "\n\n_(đã dừng)_" } : m,
          ),
        );
      } else {
        toast.error(msg);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, text: msg, error: true } : m)),
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();
  const clear = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <DashLayout
      title="Trợ lý AI cho doanh nghiệp"
      description={`Trò chuyện với ${CHAT_MODEL} qua Coachio.`}
    >
      <div className="max-w-4xl mx-auto h-[calc(100vh-9rem)] flex flex-col rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-border flex items-center gap-3">
          <div
            className="size-9 rounded-lg flex items-center justify-center text-white"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Sparkles className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Gemini 3.1 Flash Lite</p>
            <p className="text-[11px] text-muted-foreground">Text · Image input · Streaming</p>
          </div>
          {messages.length > 0 && (
            <Button size="sm" variant="ghost" onClick={clear}>
              <Trash2 className="size-4" /> Xoá hội thoại
            </Button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-10">
              <div
                className="size-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                style={{ background: "var(--gradient-brand)" }}
              >
                <Bot className="size-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Chào! Tôi có thể giúp gì cho doanh nghiệp?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Hỏi về marketing, nội dung, vận hành hoặc gửi kèm ảnh để phân tích.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 max-w-xl w-full mt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-sm rounded-xl border border-border bg-background/60 hover:bg-accent px-3 py-2.5 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={"flex gap-3 " + (m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "assistant" && (
                <div className="size-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Bot className="size-4" />
                </div>
              )}
              <div className={"max-w-[80%] " + (m.role === "user" ? "items-end" : "items-start")}>
                {m.images && m.images.length > 0 && (
                  <div className="flex gap-1.5 mb-1.5 flex-wrap justify-end">
                    {m.images.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt=""
                        className="size-20 rounded-lg object-cover border border-border"
                      />
                    ))}
                  </div>
                )}
                {(m.text || m.role === "assistant") && (
                  <div
                    className={
                      m.role === "user"
                        ? "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed bg-primary text-primary-foreground"
                        : m.error
                          ? "rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-destructive/10 text-destructive border border-destructive/30"
                          : "rounded-2xl px-4 py-3 text-sm bg-muted/60 border border-border/60 text-foreground"
                    }
                  >
                    {m.role === "assistant" && !m.error ? (
                      m.text ? (
                        <MarkdownBubble text={m.text} />
                      ) : (
                        <span className="inline-flex gap-1 items-center text-muted-foreground">
                          <span className="size-1.5 rounded-full bg-current animate-pulse" />
                          <span className="size-1.5 rounded-full bg-current animate-pulse [animation-delay:120ms]" />
                          <span className="size-1.5 rounded-full bg-current animate-pulse [animation-delay:240ms]" />
                        </span>
                      )
                    ) : (
                      m.text
                    )}
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="size-8 shrink-0 rounded-full bg-muted flex items-center justify-center">
                  <User className="size-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Composer */}
        <div className="border-t border-border p-3 bg-background/40">
          {images.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {images.map((src, i) => (
                <div key={i} className="relative">
                  <img
                    src={src}
                    alt=""
                    className="size-16 rounded-lg object-cover border border-border"
                  />
                  <button
                    onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-foreground text-background flex items-center justify-center shadow"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <label className="cursor-pointer rounded-lg border border-border bg-background hover:bg-accent size-10 flex items-center justify-center shrink-0">
              <ImgIcon className="size-4 text-muted-foreground" />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => {
                  onPickImages(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <Textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!streaming) send();
                }
              }}
              placeholder="Nhập câu hỏi cho trợ lý… (Enter để gửi, Shift+Enter xuống dòng)"
              rows={1}
              className="min-h-[40px] max-h-40 resize-none flex-1"
            />
            {streaming ? (
              <Button onClick={stop} variant="destructive" size="icon" className="size-10 shrink-0">
                <Square className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={() => send()}
                disabled={!input.trim() && images.length === 0}
                size="icon"
                className="size-10 shrink-0"
              >
                <Send className="size-4" />
              </Button>
            )}
          </div>
          {!apiKey && (
            <p className="text-[11px] text-destructive mt-2">
              Chưa có API key — vào mục “Cấu hình API” để thêm trước khi chat.
            </p>
          )}
        </div>
      </div>
    </DashLayout>
  );
}
