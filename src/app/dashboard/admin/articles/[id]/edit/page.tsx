import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ArticleForm from "../../../_components/ArticleForm";
import { updateArticle } from "../../../_actions";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await db.article.findUnique({ where: { id } });
  if (!article) notFound();

  const updateAction = updateArticle.bind(null, article.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Edit Article: {article.title}
      </h1>
      <ArticleForm article={article} action={updateAction} />
    </div>
  );
}
