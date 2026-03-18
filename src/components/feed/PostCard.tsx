"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PostWithAuthor } from "@/types/database";

interface PostCardProps {
  post: PostWithAuthor;
  currentUserId: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const [liked, setLiked] = useState(!!post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentCount, setCommentCount] = useState(post.comment_count ?? 0);
  const [submittingComment, setSubmittingComment] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const authorName = post.profiles?.full_name ?? "Colaborador";
  const authorAvatar = post.profiles?.avatar_url;
  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function toggleLike() {
    if (liked) {
      await supabase.from("post_likes").delete().match({ post_id: post.id, user_id: currentUserId });
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: currentUserId });
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
    router.refresh();
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    await supabase.from("post_comments").insert({
      post_id: post.id,
      author_id: currentUserId,
      content: commentText.trim(),
    });
    setCommentText("");
    setCommentCount((c) => c + 1);
    setSubmittingComment(false);
    router.refresh();
  }

  return (
    <article className="rounded-2xl border border-neutral-200/80 bg-white shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 overflow-hidden rounded-full bg-neutral-200 ring-2 ring-white">
            {authorAvatar ? (
              <img src={authorAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-neutral-600">
                {initials}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-neutral-900">{authorName}</p>
              <time className="shrink-0 text-xs text-neutral-500" dateTime={post.created_at}>
                {formatDate(post.created_at)}
              </time>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-neutral-700">{post.content}</p>
          </div>
        </div>
        {post.image_url && (
          <div className="mt-4 rounded-xl overflow-hidden border border-neutral-100">
            <img
              src={post.image_url}
              alt=""
              className="w-full max-h-96 object-cover object-center"
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 border-t border-neutral-100 px-5 py-2">
        <button
          type="button"
          onClick={toggleLike}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-red-50 hover:text-red-600"
        >
          <span className={liked ? "text-red-500" : ""}>
            {liked ? "❤️" : "🤍"}
          </span>
          <span>{likeCount} {likeCount === 1 ? "Curtida" : "Curtidas"}</span>
        </button>
        <button
          type="button"
          onClick={() => setCommentOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
        >
          💬 {commentCount} {commentCount === 1 ? "Comentário" : "Comentários"}
        </button>
      </div>
      {commentOpen && (
        <div className="border-t border-neutral-100 bg-neutral-50/50 p-4">
          <form onSubmit={submitComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escreva um comentário..."
              className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
