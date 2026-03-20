"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FEEDBACK_DIMENSIONS } from "@/types/database";
import type { PendingFeedbackRequestItem } from "@/app/app/feedback/page";

interface SendFeedbackModalProps {
  orgId: string;
  fromUserId: string;
  pendingRequests: PendingFeedbackRequestItem[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SCORES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export function SendFeedbackModal({
  orgId,
  fromUserId,
  pendingRequests,
  open,
  onClose,
  onSuccess,
}: SendFeedbackModalProps) {
  const [aboutUserId, setAboutUserId] = useState("");
  const [requestId, setRequestId] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [inPerson, setInPerson] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [content, setContent] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [members, setMembers] = useState<{ id: string; full_name: string | null }[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
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

    supabase
      .from("feedback_templates")
      .select("id, name")
      .eq("org_id", orgId)
      .order("name")
      .then(({ data }) => {
        if (data) setTemplates(data);
      });
  }, [open, orgId, fromUserId]);

  useEffect(() => {
    const initial: Record<string, number> = {};
    FEEDBACK_DIMENSIONS.forEach((d) => {
      initial[d.key] = 3;
    });
    setScores(initial);
    setRequestId("");
    setTemplateId("");
    setContent("");
    setInternalNotes("");
    setIsAnonymous(false);
    setInPerson(false);
  }, [open]);

  useEffect(() => {
    if (!requestId) return;
    const selected = pendingRequests.find((r) => r.id === requestId);
    if (selected?.requester_id) {
      setAboutUserId(selected.requester_id);
    }
  }, [requestId, pendingRequests]);

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
    let feedback: { id: string } | null = null;
    let insertErr: { message: string } | null = null;

    const fullInsert = await supabase
      .from("feedbacks")
      .insert({
        org_id: orgId,
        from_user_id: user.id,
        about_user_id: aboutUserId,
        request_id: requestId || null,
        is_anonymous: isAnonymous,
        template_id: templateId || null,
        content: content.trim() || null,
        in_person: inPerson,
        internal_notes: internalNotes.trim() || null,
      })
      .select("id")
      .single();

    feedback = (fullInsert.data as { id: string } | null) ?? null;
    insertErr = fullInsert.error ? { message: fullInsert.error.message } : null;

    // Retrocompatibilidade: caso colunas novas ainda não existam no banco, tenta payload mínimo.
    if (
      insertErr?.message &&
      (insertErr.message.includes("is_anonymous") ||
        insertErr.message.includes("template_id") ||
        insertErr.message.includes("content") ||
        insertErr.message.includes("in_person") ||
        insertErr.message.includes("internal_notes"))
    ) {
      const fallbackInsert = await supabase
        .from("feedbacks")
        .insert({
          org_id: orgId,
          from_user_id: user.id,
          about_user_id: aboutUserId,
          request_id: requestId || null,
        })
        .select("id")
        .single();

      feedback = (fallbackInsert.data as { id: string } | null) ?? null;
      insertErr = fallbackInsert.error ? { message: fallbackInsert.error.message } : null;
    }

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

    if (scoresErr) {
      setLoading(false);
      setError(scoresErr.message);
      return;
    }

    if (requestId) {
      await supabase
        .from("feedback_requests")
        .update({ status: "completed" })
        .eq("id", requestId);
    }

    setLoading(false);
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
          Selecione um colaborador e preencha os campos do feedback.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Solicitação pendente (opcional)
            </label>
            <select
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="">Nenhuma</option>
              {pendingRequests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.requester_name ?? "Colaborador"} - {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </option>
              ))}
            </select>
          </div>

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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-0.5"
              />
              Feedback anônimo para o colaborador
            </label>
            <label className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={inPerson}
                onChange={(e) => setInPerson(e.target.checked)}
                className="mt-0.5"
              />
              Feedback foi dado presencialmente
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Modelo de feedback
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="">Nenhum modelo</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Itens da empresa (0,5 a 5,0)
            </p>
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

          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Descreva seu feedback
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              placeholder="Contexto, pontos fortes, oportunidades e próximos passos."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Anotações internas (apenas para você)
            </label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              placeholder="Observações privadas."
            />
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
