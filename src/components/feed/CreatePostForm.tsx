"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface CreatePostFormProps {
  orgId: string;
}

export function CreatePostForm({ orgId }: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
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
      content: content.trim(),
      image_url: imageUrl.trim() || null,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setContent("");
    setImageUrl("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm"
    >
      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="O que você quer compartilhar?"
        rows={3}
        className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        required
      />
      <div className="mt-3 flex items-center gap-3">
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="URL da imagem (opcional)"
          className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50/50 px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Publicando…" : "Publicar"}
        </button>
      </div>
    </form>
  );
}
