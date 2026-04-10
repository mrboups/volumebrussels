"use client";

import { useState, useTransition } from "react";

type Lang = "en" | "fr" | "nl";

const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  fr: "Français",
  nl: "Nederlands",
};

interface GiveawayFormData {
  id?: string;
  slug?: string;
  passType?: "night" | "weekend";
  isActive?: boolean;
  titleEn?: string | null;
  descriptionEn?: string | null;
  successMessageEn?: string | null;
  titleFr?: string | null;
  descriptionFr?: string | null;
  successMessageFr?: string | null;
  titleNl?: string | null;
  descriptionNl?: string | null;
  successMessageNl?: string | null;
}

interface Props {
  form?: GiveawayFormData;
  action: (formData: FormData) => Promise<void>;
}

export default function GiveawayFormEditor({ form, action }: Props) {
  const [activeLang, setActiveLang] = useState<Lang>("en");
  const [translating, startTranslate] = useTransition();
  const [translateError, setTranslateError] = useState<string | null>(null);

  // Per-language fields stored in state so the Translate button can update them.
  const [fields, setFields] = useState({
    en: {
      title: form?.titleEn ?? "",
      description: form?.descriptionEn ?? "",
      successMessage: form?.successMessageEn ?? "",
    },
    fr: {
      title: form?.titleFr ?? "",
      description: form?.descriptionFr ?? "",
      successMessage: form?.successMessageFr ?? "",
    },
    nl: {
      title: form?.titleNl ?? "",
      description: form?.descriptionNl ?? "",
      successMessage: form?.successMessageNl ?? "",
    },
  });

  function setField(lang: Lang, key: "title" | "description" | "successMessage", value: string) {
    setFields((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], [key]: value },
    }));
  }

  async function handleTranslate() {
    setTranslateError(null);
    const source = fields[activeLang];
    if (!source.title.trim()) {
      setTranslateError("Fill the title in the current language first.");
      return;
    }
    const targets: Lang[] = (["en", "fr", "nl"] as Lang[]).filter((l) => l !== activeLang);

    startTranslate(async () => {
      try {
        const res = await fetch("/api/ai/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceLang: activeLang,
            targets,
            fields: {
              title: source.title,
              ...(source.description ? { description: source.description } : {}),
              ...(source.successMessage ? { successMessage: source.successMessage } : {}),
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Translation failed");
        const translations = data.translations as Record<
          Lang,
          { title?: string; description?: string; successMessage?: string }
        >;
        setFields((prev) => {
          const next = { ...prev };
          for (const t of targets) {
            const tr = translations[t];
            if (!tr) continue;
            next[t] = {
              title: tr.title ?? prev[t].title,
              description: tr.description ?? prev[t].description,
              successMessage: tr.successMessage ?? prev[t].successMessage,
            };
          }
          return next;
        });
      } catch (err) {
        setTranslateError(err instanceof Error ? err.message : "Translation failed");
      }
    });
  }

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      {/* Hidden language fields — server reads all 3 */}
      {(["en", "fr", "nl"] as Lang[]).map((lang) => (
        <div key={`hidden-${lang}`}>
          <input type="hidden" name={`title${lang === "en" ? "En" : lang === "fr" ? "Fr" : "Nl"}`} value={fields[lang].title} />
          <input type="hidden" name={`description${lang === "en" ? "En" : lang === "fr" ? "Fr" : "Nl"}`} value={fields[lang].description} />
          <input type="hidden" name={`successMessage${lang === "en" ? "En" : lang === "fr" ? "Fr" : "Nl"}`} value={fields[lang].successMessage} />
        </div>
      ))}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            name="slug"
            defaultValue={form?.slug ?? ""}
            placeholder="Auto-generated from title"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pass Type *</label>
          <select
            name="passType"
            required
            defaultValue={form?.passType ?? "night"}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          >
            <option value="night">Night Pass</option>
            <option value="weekend">Weekend Pass</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          name="isActive"
          type="checkbox"
          defaultChecked={form?.isActive ?? true}
          className="rounded border-gray-300"
        />
        Active (form is reachable at the public URL)
      </label>

      {/* Language tabs */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2">
          <div className="flex gap-1">
            {(["en", "fr", "nl"] as Lang[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveLang(lang)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-md transition-colors ${
                  activeLang === lang
                    ? "bg-black text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
                }`}
              >
                {LANG_LABELS[lang]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleTranslate}
            disabled={translating}
            className="text-xs font-semibold uppercase tracking-wide text-gray-700 border border-gray-300 rounded-md px-3 py-1.5 hover:bg-white disabled:opacity-50"
          >
            {translating ? "Translating..." : "Translate with AI"}
          </button>
        </div>

        {translateError && (
          <div className="px-3 py-2 bg-red-50 border-b border-red-200 text-xs text-red-700">
            {translateError}
          </div>
        )}

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *{" "}
              <span className="text-gray-400 text-xs font-normal">
                ({LANG_LABELS[activeLang]})
              </span>
            </label>
            <input
              value={fields[activeLang].title}
              onChange={(e) => setField(activeLang, "title", e.target.value)}
              required={activeLang === "en"}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description{" "}
              <span className="text-gray-400 text-xs font-normal">
                ({LANG_LABELS[activeLang]})
              </span>
            </label>
            <textarea
              rows={8}
              value={fields[activeLang].description}
              onChange={(e) => setField(activeLang, "description", e.target.value)}
              placeholder="Plain text. Paste a full URL on its own line to embed it as an image, or inline any URL to make it a clickable link."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black font-mono"
            />
            <p className="mt-1 text-xs text-gray-400">
              Links become clickable automatically. A line containing only an
              image URL (.jpg, .png, .webp, .gif, .svg) is rendered as an image.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Success message after submit{" "}
              <span className="text-gray-400 text-xs font-normal">
                ({LANG_LABELS[activeLang]})
              </span>
            </label>
            <textarea
              rows={2}
              value={fields[activeLang].successMessage}
              onChange={(e) => setField(activeLang, "successMessage", e.target.value)}
              placeholder={
                activeLang === "en"
                  ? "Thanks! Check your inbox — your free pass is on the way."
                  : ""
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
        >
          {form?.id ? "Update Form" : "Create Form"}
        </button>
        <a
          href="/dashboard/admin/giveaways"
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
