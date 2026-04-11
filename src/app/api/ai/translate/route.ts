import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/session";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type Lang = "en" | "fr" | "nl";
const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  fr: "French",
  nl: "Dutch",
};

interface TranslateBody {
  sourceLang: Lang;
  fields: {
    title: string;
    description?: string;
    successMessage?: string;
  };
  // Which target languages to fill
  targets: Lang[];
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as TranslateBody;
    const { sourceLang, fields, targets } = body;

    if (!sourceLang || !fields?.title) {
      return NextResponse.json(
        { error: "sourceLang and fields.title are required" },
        { status: 400 }
      );
    }
    if (!Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json(
        { error: "targets must be a non-empty array" },
        { status: 400 }
      );
    }

    const sourceName = LANG_NAMES[sourceLang];
    const targetList = targets.map((t) => LANG_NAMES[t]).join(", ");

    const system = `You are a professional translator for Volume Brussels, a Brussels nightlife pass platform. You translate short marketing form copy between English, French, and Dutch.

Keep the tone friendly and concise, preserve line breaks, do not add extra content, do not translate the brand name "Volume Brussels". Return strict JSON.`;

    const userPrompt = `Source language: ${sourceName}
Target languages: ${targetList}

Fields to translate:
title: ${fields.title}
${fields.description ? `description: ${fields.description}` : ""}
${fields.successMessage ? `successMessage: ${fields.successMessage}` : ""}

Return a JSON object with this shape:
{
  "translations": {
    ${targets
      .map(
        (t) => `"${t}": { "title": "...", "description": "...", "successMessage": "..." }`
      )
      .join(",\n    ")}
  }
}

Only include the fields that were provided in the source. If description or successMessage was not provided, omit them from the translation output.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI translate error:", res.status, err);
      return NextResponse.json(
        { error: `AI error: ${res.status}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({ translations: parsed.translations ?? {} });
  } catch (err) {
    console.error("Translate error:", err);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
