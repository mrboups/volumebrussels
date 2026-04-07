import ArticleForm from "../../_components/ArticleForm";
import { createArticle } from "../../_actions";

export const dynamic = "force-dynamic";

export default function NewArticlePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Add Article</h1>
      <ArticleForm action={createArticle} />
    </div>
  );
}
