import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { title, eventContext } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const userPrompt = eventContext
      ? `Write an article with the title: "${title}".${eventContext}`
      : `Write an article with the title: "${title}"`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a writer for Volume Brussels, a nightlife pass platform in Brussels, Belgium. Write engaging articles about Brussels nightlife, clubs, electronic music, culture, and tourism.

Write in plain text (not HTML or markdown). Use line breaks between paragraphs. Keep a friendly, informative tone. The article should be 4-6 paragraphs long.

Return a JSON object with these fields:
- summary: a 1-2 sentence summary (max 200 chars)
- content: the full article text with line breaks between paragraphs`,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const data = await res.json();
    const content = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({
      summary: content.summary || "",
      content: content.content || "",
    });
  } catch (err) {
    console.error("AI error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
