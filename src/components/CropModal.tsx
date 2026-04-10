"use client";

import { useState, useRef } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface CropModalProps {
  image: string;
  aspect?: number;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

const ASPECT_OPTIONS = [
  { label: "Free", value: 0 },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
];

function initialCrop(imageWidth: number, imageHeight: number, aspect: number | undefined): Crop {
  if (aspect) {
    return centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, aspect, imageWidth, imageHeight),
      imageWidth,
      imageHeight
    );
  }
  return { unit: "%", x: 5, y: 5, width: 90, height: 90 };
}

async function getCroppedBlob(imgEl: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = imgEl.naturalWidth / imgEl.width;
  const scaleY = imgEl.naturalHeight / imgEl.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.drawImage(
    imgEl,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width * scaleX,
    crop.height * scaleY
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/jpeg", 0.92);
  });
}

export default function CropModal({ image, aspect: defaultAspect = 16 / 9, onCancel, onConfirm }: CropModalProps) {
  const [crop, setCrop] = useState<Crop | undefined>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedAspect, setSelectedAspect] = useState<number>(defaultAspect);
  const imgRef = useRef<HTMLImageElement | null>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(initialCrop(width, height, selectedAspect === 0 ? undefined : selectedAspect));
  }

  function handleAspectChange(value: number) {
    setSelectedAspect(value);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(initialCrop(width, height, value === 0 ? undefined : value));
    }
  }

  async function handleSave() {
    if (!completedCrop || !imgRef.current) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      onConfirm(blob);
    } catch (err) {
      console.error("Crop error:", err);
      alert("Failed to crop image");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl flex flex-col" style={{ maxHeight: "90vh" }}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold">Crop Image</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-black cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-auto bg-gray-100 flex items-center justify-center p-4" style={{ maxHeight: "60vh" }}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={selectedAspect === 0 ? undefined : selectedAspect}
            keepSelection
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={image}
              alt="Crop"
              onLoad={onImageLoad}
              style={{ maxHeight: "50vh", maxWidth: "100%" }}
            />
          </ReactCrop>
        </div>

        <div className="p-4 border-t border-gray-200 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 uppercase tracking-wide mr-2">Ratio</span>
            {ASPECT_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleAspectChange(opt.value)}
                className={`px-3 py-1 text-xs font-medium rounded border cursor-pointer transition-colors ${
                  selectedAspect === opt.value
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !completedCrop}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
