"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface CreatePostFormProps {
  orgId: string;
  authorName?: string;
  authorAvatar?: string | null;
}

export function CreatePostForm({
  orgId,
  authorName = "Você",
  authorAvatar,
}: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const initials = authorName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  function handleCancel() {
    setContent("");
    setExpanded(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sessão expirada. Faça login novamente.");
      setLoading(false);
      return;
    }
    const { error: err } = await supabase.from("posts").insert({
      org_id: orgId,
      author_id: user.id,
      content: text,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setContent("");
    setExpanded(false);
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
      {/* Linha do compositor — clique expande */}
      {!expanded ? (
        <div className="flex items-center gap-3 p-4">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#5227FF] to-[#27FFC8] flex items-center justify-center text-white text-sm font-semibold ring-2 ring-white">
            {authorAvatar ? (
              <img src={authorAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{initials || "?"}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-left text-sm text-neutral-400 hover:bg-neutral-100 transition"
          >
            O que você quer compartilhar com a equipe?
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Cabeçalho expandido */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#5227FF] to-[#27FFC8] flex items-center justify-center text-white text-sm font-semibold ring-2 ring-white">
              {authorAvatar ? (
                <img src={authorAvatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{initials || "?"}</span>
              )}
            </div>
            <p className="font-semibold text-sm text-neutral-900">{authorName}</p>
          </div>

          {/* Textarea */}
          <div className="px-4 pb-3">
            {error && (
              <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que você quer compartilhar com a equipe?"
              rows={3}
              className="w-full resize-none overflow-hidden bg-transparent text-[15px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 px-4 py-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="rounded-xl px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="rounded-xl bg-[#5227FF] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4520e0] disabled:opacity-50"
            >
              {loading ? "Publicando…" : "Publicar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
