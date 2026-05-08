"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { readFileAsDataUrl } from "@/lib/cropUtils";
import CropImageModal from "@/components/CropImageModal";

interface Props {
  userId: string;
  initial: string;
  fotoUrl?: string | null;
}

export default function FotoPerfilUpload({ userId, initial, fotoUrl }: Props) {
  const [currentUrl, setCurrentUrl] = useState(fotoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setImageSrc(dataUrl);
    e.target.value = "";
  }

  async function handleCropConfirm(blob: Blob) {
    setImageSrc(null);
    setUploading(true);
    const supabase = createClient();
    const path = `perfis/${userId}/foto-perfil`;
    const { error: upErr } = await supabase.storage
      .from("documentos")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (upErr) {
      console.error("[FotoPerfilUpload] upload error:", upErr.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ foto_url: urlData.publicUrl }).eq("id", userId);
    setCurrentUrl(publicUrl);
    setUploading(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Alterar foto de perfil"
        className="relative flex-shrink-0 w-16 h-16 rounded-full overflow-hidden group cursor-pointer"
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-2xl font-bold select-none"
            style={{ backgroundColor: "#4CAF50", color: "white" }}
          >
            {initial}
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
              <path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth={1.8} />
            </svg>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </button>

      {imageSrc && (
        <CropImageModal
          imageSrc={imageSrc}
          onCancel={() => setImageSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </>
  );
}
