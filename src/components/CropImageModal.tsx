"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { getCroppedBlob } from "@/lib/cropUtils";

interface Props {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

export default function CropImageModal({ imageSrc, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, pixelCrop: Area) => {
    setCroppedAreaPixels(pixelCrop);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } catch {
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: "rgba(0,0,0,0.93)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#4CAF50" }}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
              <path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth={1.8} />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Ajustar foto</p>
            <p className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.4)" }}>Recorte circular · 1:1</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Crop area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 px-5 pb-8 pt-4">
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" style={{ color: "rgba(255,255,255,0.35)" }}>
            <circle cx="11" cy="11" r="5" stroke="currentColor" strokeWidth={1.8} />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
          </svg>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
            style={{ accentColor: "#4CAF50" }}
          />
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" style={{ color: "rgba(255,255,255,0.35)" }}>
            <circle cx="11" cy="11" r="5" stroke="currentColor" strokeWidth={1.8} />
            <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-center text-xs mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>
          Arraste para reposicionar · Role ou deslize para zoom
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-white/10"
            style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.75)" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing || !croppedAreaPixels}
            className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#4CAF50" }}
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                Salvando...
              </span>
            ) : "Salvar foto"}
          </button>
        </div>
      </div>
    </div>
  );
}
