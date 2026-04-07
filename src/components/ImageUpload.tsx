"use client";

import { useState, useRef } from "react";

interface ImageUploadProps {
  name: string;
  currentImage?: string | null;
}

export default function ImageUpload({ name, currentImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(currentImage || "");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    // Upload
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setUrl(data.url);
      } else {
        alert(data.error || "Upload failed");
        setPreview(currentImage || null);
      }
    } catch {
      alert("Upload failed");
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <div
        onClick={() => inputRef.current?.click()}
        className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded" />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="py-8">
            <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500 mt-2">Click to upload image</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP (max 5MB)</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
      {preview && !uploading && (
        <button
          type="button"
          onClick={() => { setPreview(null); setUrl(""); if (inputRef.current) inputRef.current.value = ""; }}
          className="mt-2 text-xs text-red-500 hover:text-red-700 cursor-pointer"
        >
          Remove image
        </button>
      )}
    </div>
  );
}
