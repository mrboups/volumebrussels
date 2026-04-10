"use client";

import { useState, useEffect } from "react";
import ImageUpload from "@/components/ImageUpload";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface ClubOption {
  id: string;
  name: string;
}

interface PricingPhase {
  name: string;
  price: number;
  startDate: string;
  endDate: string;
}

interface EventData {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  venueName: string | null;
  venueAddress: string | null;
  date: Date;
  clubId: string | null;
  isLinkedToPass: boolean;
  isActive: boolean;
  pricingPhases: {
    name: string;
    price: number;
    startDate: Date;
    endDate: Date;
  }[];
}

const PHASE_NAMES = ["early_bird", "regular", "last_minute"];

function formatDatetimeLocal(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventForm({
  event,
  clubs,
  action,
}: {
  event?: EventData;
  clubs: ClubOption[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [name, setName] = useState(event?.name ?? "");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [autoSlug, setAutoSlug] = useState(!event);
  const [phases, setPhases] = useState<PricingPhase[]>(
    event?.pricingPhases.map((p) => ({
      name: p.name,
      price: p.price,
      startDate: formatDatetimeLocal(new Date(p.startDate)),
      endDate: formatDatetimeLocal(new Date(p.endDate)),
    })) ?? []
  );

  useEffect(() => {
    if (autoSlug) setSlug(slugify(name));
  }, [name, autoSlug]);

  function addPhase() {
    setPhases([...phases, { name: "regular", price: 0, startDate: "", endDate: "" }]);
  }

  function removePhase(index: number) {
    setPhases(phases.filter((_, i) => i !== index));
  }

  function updatePhase(index: number, field: keyof PricingPhase, value: string | number) {
    setPhases(phases.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function handleSubmit(formData: FormData) {
    formData.set("pricingPhases", JSON.stringify(phases.map((p) => ({ ...p, price: Number(p.price) }))));
    return action(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-2xl">
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={event?.description ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
        <ImageUpload name="coverImage" currentImage={event?.coverImage} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            name="date"
            type="datetime-local"
            required
            defaultValue={(() => {
              const today = new Date();
              today.setHours(22, 0, 0, 0);
              return event ? formatDatetimeLocal(new Date(event.date)) : formatDatetimeLocal(today);
            })()}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Club *</label>
          <select
            name="clubId"
            required
            defaultValue={event?.clubId ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          >
            <option value="" disabled>Select a club</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name (optional, if different from club)</label>
          <input
            name="venueName"
            defaultValue={event?.venueName ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Venue Address (optional)</label>
          <input
            name="venueAddress"
            defaultValue={event?.venueAddress ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            name="isLinkedToPass"
            type="checkbox"
            defaultChecked={event?.isLinkedToPass ?? false}
            className="rounded border-gray-300"
          />
          Linked to Pass
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={event?.isActive ?? true}
            className="rounded border-gray-300"
          />
          Active
        </label>
      </div>

      {/* Pricing Phases */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Pricing Phases</h3>
          <button
            type="button"
            onClick={addPhase}
            className="text-sm text-black font-medium hover:underline"
          >
            + Add Phase
          </button>
        </div>

        {phases.length === 0 && (
          <p className="text-sm text-gray-400">No pricing phases added.</p>
        )}

        {phases.map((phase, i) => (
          <div key={i} className="border border-gray-100 rounded-md p-3 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Phase {i + 1}</span>
              <button
                type="button"
                onClick={() => removePhase(i)}
                className="text-red-500 text-sm hover:underline"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select
                  value={phase.name}
                  onChange={(e) => updatePhase(i, "name", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                >
                  {PHASE_NAMES.map((n) => (
                    <option key={n} value={n}>
                      {n.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Price (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={phase.price}
                  onChange={(e) => updatePhase(i, "price", parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  value={phase.startDate}
                  onChange={(e) => updatePhase(i, "startDate", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input
                  type="datetime-local"
                  value={phase.endDate}
                  onChange={(e) => updatePhase(i, "endDate", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
        >
          {event ? "Update Event" : "Create Event"}
        </button>
        <a
          href="/dashboard/admin/events"
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
