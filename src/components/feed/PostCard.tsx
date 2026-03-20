"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PostWithAuthor } from "@/types/database";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profile: { full_name: string | null; avatar_url: string | null } | null;
}

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
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function Avatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sizeClass =
    size === "sm"
      ? "h-8 w-8 text-xs"
      : size === "lg"
      ? "h-12 w-12 text-base"
      : "h-10 w-10 text-sm";

  return (
    <div
      className={`${sizeClass} shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#5227FF] to-[#27FFC8] flex items-center justify-center text-white font-semibold ring-2 ring-white`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{initials || "?"}</span>
      )}
    </div>
  );
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const [liked, setLiked] = useState(!!post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [commentCount, setCommentCount] = useState(post.comment_count ?? 0);
  const [commentOpen, setCommentOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const supabase = createClient();
  const authorName = post.profiles?.full_name ?? "Colaborador";
  const authorAvatar = post.profiles?.avatar_url;

  const loadComments = useCallback(async () => {
    if (comments !== null) return;
    setLoadingComments(true);

    const { data: commentRows } = await supabase
      .from("post_comments")
      .select("id, content, created_at, author_id")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });

    const authorIds = Array.from(new Set((commentRows ?? []).map((c) => c.author_id)));
    let profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", authorIds);
      profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    }

    setComments(
      (commentRows ?? []).map((c) => ({
        ...c,
        profile: profileMap.get(c.author_id) ?? null,
      }))
    );
    setLoadingComments(false);
  }, [post.id, comments, supabase]);

  async function toggleComments() {
    if (!commentOpen) await loadComments();
    setCommentOpen((o) => !o);
  }

  async function toggleLike() {
    if (likeLoading) return;
    setLikeLoading(true);
    if (liked) {
      await supabase
        .from("post_likes")
        .delete()
        .match({ post_id: post.id, user_id: currentUserId });
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      await supabase
        .from("post_likes")
        .insert({ post_id: post.id, user_id: currentUserId });
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
    setLikeLoading(false);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    setSubmitting(true);

    const { data: inserted } = await supabase
      .from("post_comments")
      .insert({ post_id: post.id, author_id: currentUserId, content: text })
      .select("id, content, created_at, author_id")
      .single();

    if (inserted) {
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", currentUserId)
        .single();

      setComments((prev) => [
        ...(prev ?? []),
        { ...inserted, profile: myProfile ?? null },
      ]);
      setCommentCount((c) => c + 1);
    }
    setCommentText("");
    setSubmitting(false);
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition hover:shadow-md">
      {/* Cabeçalho do post */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Avatar name={authorName} avatarUrl={authorAvatar} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[15px] text-neutral-900 leading-snug">
            {authorName}
          </p>
          <time
            className="text-xs text-neutral-400"
            dateTime={post.created_at}
            title={new Date(post.created_at).toLocaleString("pt-BR")}
          >
            {formatDate(post.created_at)}
          </time>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 pb-4">
        <p className="whitespace-pre-wrap text-[15px] text-neutral-800 leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Imagem */}
      {post.image_url && (
        <div className="border-t border-neutral-100">
          <img
            src={post.image_url}
            alt=""
            className="w-full max-h-[500px] object-cover object-center"
          />
        </div>
      )}

      {/* Contadores — linha discreta estilo Facebook */}
      {(likeCount > 0 || commentCount > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-sm text-neutral-500">
          {likeCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] leading-none">
                ❤️
              </span>
              <span>{likeCount}</span>
            </span>
          )}
          {commentCount > 0 && (
            <button
              type="button"
              onClick={toggleComments}
              className="ml-auto text-xs hover:underline"
            >
              {commentCount} {commentCount === 1 ? "comentário" : "comentários"}
            </button>
          )}
        </div>
      )}

      {/* Linha de ações */}
      <div className="flex items-center border-t border-neutral-100 mx-2 mb-1">
        <button
          type="button"
          onClick={toggleLike}
          disabled={likeLoading}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition hover:bg-neutral-50 active:scale-95 ${
            liked ? "text-red-500" : "text-neutral-500"
          }`}
        >
          <svg
            className="h-5 w-5"
            fill={liked ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          Curtir
        </button>

        <div className="h-5 w-px bg-neutral-100" />

        <button
          type="button"
          onClick={toggleComments}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50 active:scale-95"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Comentar
        </button>
      </div>

      {/* Seção de comentários */}
      {commentOpen && (
        <div className="border-t border-neutral-100 bg-neutral-50/60 px-4 py-4 space-y-3">
          {/* Comentários existentes */}
          {loadingComments ? (
            <div className="flex items-center justify-center py-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5227FF] border-t-transparent" />
            </div>
          ) : (
            <>
              {(comments ?? []).length === 0 ? (
                <p className="text-center text-xs text-neutral-400 py-1">
                  Sem comentários ainda. Seja o primeiro!
                </p>
              ) : (
                <ul className="space-y-3">
                  {(comments ?? []).map((c) => {
                    const cName = c.profile?.full_name ?? "Colaborador";
                    return (
                      <li key={c.id} className="flex items-start gap-2">
                        <Avatar
                          name={cName}
                          avatarUrl={c.profile?.avatar_url}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="rounded-2xl rounded-tl-sm bg-white border border-neutral-100 px-3 py-2 shadow-sm">
                            <p className="text-xs font-semibold text-neutral-800">
                              {cName}
                            </p>
                            <p className="mt-0.5 text-sm text-neutral-700 leading-snug">
                              {c.content}
                            </p>
                          </div>
                          <p className="mt-1 pl-3 text-[11px] text-neutral-400">
                            {formatDate(c.created_at)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {/* Input de novo comentário */}
          <form onSubmit={submitComment} className="flex items-center gap-2 pt-1">
            <Avatar name="Você" size="sm" />
            <div className="flex flex-1 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 shadow-sm focus-within:border-[#5227FF]/40 focus-within:ring-2 focus-within:ring-[#5227FF]/10 transition">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escreva um comentário..."
                className="flex-1 bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitComment(e as unknown as React.FormEvent);
                  }
                }}
              />
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="shrink-0 rounded-full bg-[#5227FF] p-1.5 text-white disabled:opacity-40 hover:bg-[#4520e0] transition active:scale-90"
                aria-label="Enviar comentário"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  );
}
