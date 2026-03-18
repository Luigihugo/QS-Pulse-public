"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const baseSlug = slugify(name.trim());
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const { data: existing } = await supabase
        .from("orgs")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }
    const { data: org, error: orgError } = await supabase
      .from("orgs")
      .insert({ name: name.trim(), slug })
      .select("id")
      .single();
    if (orgError) {
      setError(orgError.message);
      setLoading(false);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sessão inválida. Faça login novamente.");
      setLoading(false);
      return;
    }
    const { error: memberError } = await supabase.from("org_members").insert({
      org_id: org.id,
      user_id: user.id,
      role: "owner",
    });
    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    router.push("/app/feed");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">Criar organização</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Crie sua empresa para começar a usar o QS Pulse.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="orgName" className="block text-sm font-medium text-neutral-700">
              Nome da organização
            </label>
            <input
              id="orgName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Minha Empresa"
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Criando…" : "Criar e entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
