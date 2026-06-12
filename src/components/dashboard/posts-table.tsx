import { formatDateShort, formatNumber } from "@/lib/format";
import type { PostRow } from "@/lib/data";

export function PostsTable({ posts }: { posts: PostRow[] }) {
  if (!posts.length) {
    return <p className="text-sm text-zinc-500">No posts yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
            <th className="py-2 pr-4 font-medium">Post</th>
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 text-right font-medium">Clicks</th>
            <th className="py-2 pr-4 text-right font-medium">Reactions</th>
            <th className="py-2 text-right font-medium">Video views</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/70">
          {posts.map((p) => (
            <tr key={p.postId} className="text-zinc-300">
              <td className="max-w-xs truncate py-2.5 pr-4">
                {p.message ?? <span className="text-zinc-500">(no text)</span>}
              </td>
              <td className="whitespace-nowrap py-2.5 pr-4 text-zinc-400">
                {p.createdTime ? formatDateShort(p.createdTime) : "—"}
              </td>
              <td className="py-2.5 pr-4 text-right tabular-nums">{formatNumber(p.clicks)}</td>
              <td className="py-2.5 pr-4 text-right tabular-nums">{formatNumber(p.reactions)}</td>
              <td className="py-2.5 text-right tabular-nums text-zinc-400">
                {p.videoViews === null ? "—" : formatNumber(p.videoViews)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
