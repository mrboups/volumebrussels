import { db } from "@/lib/db";
import Link from "next/link";
import { deleteArticle } from "../_actions";
import DeleteButton from "../_components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const articles = await db.article.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
        <Link
          href="/dashboard/admin/articles/new"
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
        >
          Add Article
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Published</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr
                key={article.id}
                className="border-b border-gray-50 hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium text-gray-900">
                  {article.title}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                      article.isPublished
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {article.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {article.publishedAt.toLocaleDateString("fr-BE")}
                </td>
                <td className="px-4 py-3 text-gray-600">{article.sortOrder}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/admin/articles/${article.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </Link>
                    <DeleteButton
                      action={deleteArticle.bind(null, article.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-400"
                >
                  No articles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Link
        href="/dashboard/admin"
        className="inline-block text-sm text-gray-500 hover:text-black"
      >
        &larr; Back to Admin
      </Link>
    </div>
  );
}
