"use client";

import Link from "next/link";

interface ArticleData {
  title: string;
  summary: string;
  content: string;
  coverImage: string | null;
  isPublished: boolean;
  sortOrder: number;
}

export default function ArticleForm({
  article,
  action,
}: {
  article?: ArticleData;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          name="title"
          type="text"
          required
          defaultValue={article?.title ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Summary
        </label>
        <textarea
          name="summary"
          rows={3}
          defaultValue={article?.summary ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Content (HTML)
        </label>
        <textarea
          name="content"
          rows={12}
          required
          defaultValue={article?.content ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cover Image URL
        </label>
        <input
          name="coverImage"
          type="text"
          defaultValue={article?.coverImage ?? ""}
          placeholder="https://..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
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
