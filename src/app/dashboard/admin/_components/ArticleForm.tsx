"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";

interface ArticleData {
  title: string;
  summary: string;
  content: string;
  coverImage: string | null;
  isPublished: boolean;
  sortOrder: number;
}

interface EventOption {
  id: string;
  name: string;
  description: string | null;
  venueName: string | null;
  date: string;
}

export default function ArticleForm({
  article,
  action,
  events = [],
}: {
  article?: ArticleData;
  action: (formData: FormData) => Promise<void>;
  events?: EventOption[];
}) {
  const [generating, setGenerating] = useState(false);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  function handleEventSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const eventId = e.target.value;
    if (!eventId) return;
    const ev = events.find((ev) => ev.id === eventId);
    if (ev && titleRef.current && !titleRef.current.value.trim()) {
      titleRef.current.value = ev.name;
    }
  }

  async function handleGenerate() {
    const title = titleRef.current?.value?.trim();
    if (!title) { alert("Enter a title first"); return; }

    // If an event is selected, include its info in the prompt
    const selectEl = document.querySelector<HTMLSelectElement>('select[data-event-select]');
    const selectedEventId = selectEl?.value;
    const selectedEvent = selectedEventId ? events.find((ev) => ev.id === selectedEventId) : null;
    const eventContext = selectedEvent
      ? ` This article is about the event "${selectedEvent.name}" at ${selectedEvent.venueName || "Brussels"} on ${selectedEvent.date}. Event description: ${selectedEvent.description || "N/A"}.`
      : "";

    setGenerating(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, eventContext }),
      });
      const data = await res.json();
      if (res.ok) {
        if (summaryRef.current) summaryRef.current.value = data.summary || "";
        if (contentRef.current) contentRef.current.value = data.content || "";
      } else {
        alert(data.error || "Generation failed");
      }
    } catch {
      alert("Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <div className="flex gap-2">
          <input
            ref={titleRef}
            name="title"
            type="text"
            required
            defaultValue={article?.title ?? ""}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer whitespace-nowrap"
          >
            {generating ? "Generating..." : "Write with AI"}
          </button>
        </div>
      </div>

      {events.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Based on event (optional)
          </label>
          <select
            data-event-select=""
            onChange={handleEventSelect}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">No event — write freely</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name} — {ev.date}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">Select an event to auto-fill the title and provide context to the AI.</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Summary
        </label>
        <textarea
          ref={summaryRef}
          name="summary"
          rows={3}
          defaultValue={article?.summary ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <textarea
          ref={contentRef}
          name="content"
          rows={12}
          required
          defaultValue={article?.content ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <p className="mt-1 text-xs text-gray-400 leading-relaxed">
          Write plain text. Line breaks are preserved. URLs starting with http are auto-linked.
          Image URLs (ending in .jpg, .png, .webp, .gif) are displayed as full-width images.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cover Image
        </label>
        <ImageUpload name="coverImage" currentImage={article?.coverImage} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sort Order
        </label>
        <input
          name="sortOrder"
          type="number"
          defaultValue={article?.sortOrder ?? 0}
          className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          name="isPublished"
          type="checkbox"
          defaultChecked={article?.isPublished ?? true}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label className="text-sm font-medium text-gray-700">Published</label>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          className="px-6 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
        >
          {article ? "Update Article" : "Create Article"}
        </button>
        <Link
          href="/dashboard/admin/articles"
          className="text-sm text-gray-500 hover:text-black"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
