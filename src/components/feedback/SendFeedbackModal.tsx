"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FEEDBACK_DIMENSIONS } from "@/types/database";

interface SendFeedbackModalProps {
  orgId: string;
  fromUserId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SCORES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export function SendFeedbackModal({
  orgId,
  fromUserId,
  open,
  onClose,
  onSuccess,
}: SendFeedbackModalProps) {
  const [aboutUserId, setAboutUserId] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [members, setMembers] = useState<{ id: string; full_name: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !orgId) return;
    const supabase = createClient();
    supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", orgId)
      .neq("user_id", fromUserId)
      .then(({ data: rows }) => {
        const ids = (rows ?? []).map((r) => r.user_id);
        if (ids.length === 0) return;
        return supabase.from("profiles").select("id, full_name").in("id", ids);
      })
      .then((res) => {
        if (res?.data) setMembers(res.data);
      });
  }, [open, orgId, fromUserId]);

  useEffect(() => {
    const initial: Record<string, number> = {};
    FEEDBACK_DIMENSIONS.forEach((d) => {
      initial[d.key] = 3;
    });
    setScores(initial);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!aboutUserId) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== fromUserId) {
      setError("Sessão expirada.");
      setLoading(false);
      return;
    }
    const { data: feedback, error: insertErr } = await supabase
      .from("feedbacks")
      .insert({
        org_id: orgId,
        from_user_id: user.id,
        about_user_id: aboutUserId,
        request_id: null,
      })
      .select("id")
      .single();

    if (insertErr || !feedback) {
      setError(insertErr?.message ?? "Erro ao enviar.");
      setLoading(false);
      return;
    }

    const scoreRows = FEEDBACK_DIMENSIONS.map((d) => ({
      feedback_id: feedback.id,
      dimension_key: d.key,
      score: scores[d.key] ?? 3,
    }));
    const { error: scoresErr } = await supabase.from("feedback_scores").insert(scoreRows);

    setLoading(false);
    if (scoresErr) {
      setError(scoresErr.message);
      return;
    }
    onSuccess();
    setAboutUserId("");
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-neutral-900">
          Enviar feedback
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Avalie um colega nas dimensões abaixo (0,5 a 5,0).
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="about"
              className="block text-sm font-medium text-neutral-700"
            >
              Sobre quem
            </label>
            <select
              id="about"
              value={aboutUserId}
              onChange={(e) => setAboutUserId(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
            {FEEDBACK_DIMENSIONS.map((d) => (
              <div key={d.key} className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium text-neutral-700">
                  {d.label}
                </label>
                <select
                  value={scores[d.key] ?? 3}
                  onChange={(e) =>
                    setScores((prev) => ({
                      ...prev,
                      [d.key]: Number(e.target.value),
                    }))
                  }
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
                >
                  {SCORES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-[#27FFC8] px-4 py-2 text-sm font-semibold text-[#0d0a14] disabled:opacity-50"
            >
              {loading ? "Enviando…" : "Enviar feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
