"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

interface CoverPhotoUploadProps {
  preview: string | null;
  onFileSelect: (file: File, previewUrl: string) => void;
  onClear: () => void;
}

export function CoverPhotoUpload({ preview, onFileSelect, onClear }: CoverPhotoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }
    onFileSelect(f, URL.createObjectURL(f));
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={handleFileChange}
      />
      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Capa" className="w-full h-32 object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1.5 right-1.5 size-7 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full h-32 rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
        >
          <ImagePlus className="size-6" />
          <span className="text-sm">Escolher imagem do computador</span>
          <span className="text-xs">JPG, PNG ou WebP — máx 5MB</span>
        </button>
      )}
    </>
  );
}
