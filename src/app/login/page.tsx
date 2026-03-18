"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { FluidBackground } from "@/components/FluidBackground";

type Mode = "login" | "signup" | "forgot";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) {
          setError(err.message);
          return;
        }
        // Redirecionamento com full page load para os cookies da sessão serem enviados ao servidor/middleware
        window.location.href = "/app/feed";
      } else if (mode === "signup") {
        if (password.length < 8) {
          setError("Sua senha deve ter pelo menos 8 caracteres.");
          return;
        }
        if (password !== password2) {
          setError("As senhas não coincidem.");
          return;
        }
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });
        if (err) {
          setError(err.message);
          return;
        }
        if (data.session) {
          window.location.href = "/app/feed";
        } else {
          setMessage(
            "Conta criada. Verifique seu e-mail para confirmar o acesso e depois faça login."
          );
        }
      } else {
        // forgot password
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login/reset`,
        });
        if (err) {
          setError(err.message);
          return;
        }
        setMessage(
          "Se este e-mail existir, enviaremos um link para redefinir a senha. Verifique sua caixa de entrada."
        );
        setMode("login");
      }
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  return (
    <main className="min-h-screen">
      <FluidBackground>
        <div className="w-full max-w-sm rounded-2xl border border-white/60 bg-white/95 p-6 shadow-lg backdrop-blur">
        <div className="flex justify-center">
          <BrandLogo variant="icon" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-neutral-900">
          {isLogin ? "Entrar" : isSignup ? "Criar conta" : "Redefinir senha"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">QS Pulse – Portal do Colaborador</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input mt-1"
              autoComplete="email"
            />
          </div>
          {!isForgot && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input mt-1"
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={isSignup ? 8 : undefined}
              />
            </div>
          )}
          {isSignup && (
            <div>
              <label htmlFor="password2" className="block text-sm font-medium text-neutral-700">
                Confirmar senha
              </label>
              <input
                id="password2"
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                className="input mt-1"
                autoComplete="new-password"
                minLength={8}
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-secondary w-full disabled:opacity-50"
          >
            {loading
              ? isLogin
                ? "Entrando…"
                : isSignup
                  ? "Criando…"
                  : "Enviando…"
              : isLogin
                ? "Entrar"
                : isSignup
                  ? "Criar conta"
                  : "Enviar link"}
          </button>
        </form>
        {isLogin && (
          <p className="mt-3 text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError(null);
                setMessage(null);
              }}
              className="font-medium text-brand-purple hover:underline"
            >
              Esqueci minha senha
            </button>
          </p>
        )}
        <p className="mt-4 text-center text-sm text-neutral-500">
          {isLogin ? (
            <>
              Não tem conta?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setMessage(null);
                }}
                className="font-medium text-brand-purple hover:underline"
              >
                Criar conta
              </button>
              .
            </>
          ) : isSignup ? (
            <>
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setMessage(null);
                }}
                className="font-medium text-brand-purple hover:underline"
              >
                Entrar
              </button>
              .
            </>
          ) : (
            <>
              Lembrou a senha?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setMessage(null);
                }}
                className="font-medium text-brand-purple hover:underline"
              >
                Voltar
              </button>
              .
            </>
          )}
        </p>
        <p className="mt-2 text-center">
          <Link href="/" className="text-sm text-brand-purple hover:underline">
            Voltar ao início
          </Link>
        </p>
        </div>
      </FluidBackground>
    </main>
  );
}
