"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FluidBackground } from "@/components/FluidBackground";
import { BrandLogo } from "@/components/branding/BrandLogo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Se o link não tiver criado uma sessão válida, updateUser vai falhar.
    // Não bloqueamos a tela aqui; só informamos caso detectemos ausência de sessão.
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setMessage(
          "Abra este link diretamente pelo e-mail de recuperação. Se expirou, solicite um novo link."
        );
      }
    });
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError("Sua nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== password2) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message);
        return;
      }
      setMessage("Senha redefinida com sucesso. Você já pode entrar.");
      setTimeout(() => router.push("/login"), 800);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <FluidBackground>
        <div className="w-full max-w-sm rounded-2xl border border-white/60 bg-white/95 p-6 shadow-lg backdrop-blur">
          <div className="flex justify-center">
            <BrandLogo variant="icon" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-neutral-900">
            Redefinir senha
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Defina uma nova senha para sua conta.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error && (
              <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {message && !error && (
              <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </p>
            )}

            <div>
              <label htmlFor="password" className="label">
                Nova senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="input mt-1"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="password2" className="label">
                Confirmar nova senha
              </label>
              <input
                id="password2"
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                minLength={8}
                className="input mt-1"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-secondary w-full disabled:opacity-50"
            >
              {loading ? "Salvando…" : "Salvar nova senha"}
            </button>
          </form>
        </div>
      </FluidBackground>
    </main>
  );
}

