import ArticleForm from "../../_components/ArticleForm";
import { createArticle } from "../../_actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const events = await db.event.findMany({
    where: { isActive: true },
    orderBy: { date: "asc" },
    select: { id: true, name: true, description: true, venueName: true, date: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Add Article</h1>
      <ArticleForm
        action={createArticle}
        events={events.map((e) => ({
          ...e,
          date: e.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        }))}
      />
    </div>
  );
}
