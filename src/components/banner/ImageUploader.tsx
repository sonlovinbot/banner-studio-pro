import { useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";

interface Props {
  label: string;
  description?: string;
  files: File[];
  onChange: (files: File[]) => void;
  max?: number;
}

export function ImageUploader({ label, description, files, onChange, max = 5 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  function handleFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, max);
    onChange(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  }

  function remove(i: number) {
    const next = files.filter((_, idx) => idx !== i);
    onChange(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-semibold text-foreground">{label}</label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="group cursor-pointer rounded-xl border-2 border-dashed border-border bg-card/40 hover:bg-card hover:border-primary/50 transition-all px-4 py-6 flex flex-col items-center justify-center text-center"
      >
        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
          <Upload className="size-5 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Kéo thả hoặc nhấn để tải lên
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tối đa {max} ảnh · JPG, PNG, WebP · ≤ 15MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {previews.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {previews.map((src, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted group"
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(i);
                }}
                className="absolute top-1 right-1 size-5 rounded-full bg-background/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {previews.length === 0 && (
            <div className="aspect-square rounded-lg border border-dashed border-border flex items-center justify-center">
              <ImageIcon className="size-4 text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
