"use client";

import { useActionState, useState, useEffect } from "react";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface ClubData {
  id?: string;
  name: string;
  slug: string;
  address: string;
  description: string | null;
  payPerVisit: number;
  openDays: string[];
  passInclusion: string;
  musicTags: string[];
  dresscodeTags: string[];
  openTime: string | null;
  closeTime: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  websiteUrl: string | null;
  isActive: boolean;
}

const DAYS = ["friday", "saturday", "sunday"];
const PASS_OPTIONS = ["friday", "saturday", "both", "weekend"];

export default function ClubForm({
  club,
  action,
}: {
  club?: ClubData;
  action: (formData: FormData) => Promise<void>;
}) {
  const [name, setName] = useState(club?.name ?? "");
  const [slug, setSlug] = useState(club?.slug ?? "");
  const [autoSlug, setAutoSlug] = useState(!club);
  const [openDays, setOpenDays] = useState<string[]>(club?.openDays ?? []);

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
          defaultValue={club?.address ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={club?.description ?? ""}
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
            defaultValue={club?.payPerVisit ?? 10}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pass Inclusion</label>
          <select
            name="passInclusion"
            defaultValue={club?.passInclusion ?? "both"}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          >
            {PASS_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Open Days</label>
        <input type="hidden" name="openDays" value={openDays.join(",")} />
        <div className="flex gap-4">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Music Tags (comma-separated)</label>
          <input
            name="musicTags"
            defaultValue={club?.musicTags.join(", ") ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dresscode Tags (comma-separated)</label>
          <input
            name="dresscodeTags"
            defaultValue={club?.dresscodeTags.join(", ") ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Open Time</label>
          <input
            name="openTime"
            type="time"
            defaultValue={club?.openTime ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Close Time</label>
          <input
            name="closeTime"
            type="time"
            defaultValue={club?.closeTime ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
          <input
            name="instagramUrl"
            type="url"
            defaultValue={club?.instagramUrl ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
          <input
            name="facebookUrl"
            type="url"
            defaultValue={club?.facebookUrl ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
          <input
            name="websiteUrl"
            type="url"
            defaultValue={club?.websiteUrl ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={club?.isActive ?? true}
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
          {club ? "Update Club" : "Create Club"}
        </button>
        <a
          href="/dashboard/admin/clubs"
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
