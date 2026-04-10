"use client";

import { useState, useEffect } from "react";
import ImageUpload from "@/components/ImageUpload";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface MuseumData {
  id?: string;
  name: string;
  slug: string;
  address: string;
  description: string | null;
  websiteUrl: string | null;
  payPerVisit: number;
  pictures: string[];
  isActive: boolean;
  openDays: string[];
  openTime: string | null;
  closeTime: string | null;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function MuseumForm({
  museum,
  action,
}: {
  museum?: MuseumData;
  action: (formData: FormData) => Promise<void>;
}) {
  const [name, setName] = useState(museum?.name ?? "");
  const [slug, setSlug] = useState(museum?.slug ?? "");
  const [autoSlug, setAutoSlug] = useState(!museum);
  const [openDays, setOpenDays] = useState<string[]>(museum?.openDays ?? []);

  useEffect(() => {
    if (autoSlug) setSlug(slugify(name));
  }, [name, autoSlug]);

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setAutoSlug(false);
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
        <input
          name="address"
          required
          defaultValue={museum?.address ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={museum?.description ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pay Per Visit (EUR)</label>
          <input
            name="payPerVisit"
            type="number"
            step="0.01"
            defaultValue={museum?.payPerVisit ?? 8}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
          <input
            name="websiteUrl"
            type="url"
            defaultValue={museum?.websiteUrl ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Open Days</label>
        <input type="hidden" name="openDays" value={openDays.join(",")} />
        <div className="flex flex-wrap gap-4">
          {DAYS.map((d) => (
            <label key={d} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={openDays.includes(d)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setOpenDays((prev) => [...prev, d]);
                  } else {
                    setOpenDays((prev) => prev.filter((day) => day !== d));
                  }
                }}
                className="rounded border-gray-300"
              />
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Open Time</label>
          <input
            name="openTime"
            type="time"
            defaultValue={museum?.openTime ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Close Time</label>
          <input
            name="closeTime"
            type="time"
            defaultValue={museum?.closeTime ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Museum Picture</label>
        <ImageUpload name="picture" currentImage={museum?.pictures?.[0] || null} />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={museum?.isActive ?? true}
            className="rounded border-gray-300"
          />
          Active
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
        >
          {museum ? "Update Museum" : "Create Museum"}
        </button>
        <a
          href="/dashboard/admin/museums"
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
