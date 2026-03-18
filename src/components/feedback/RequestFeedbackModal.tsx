"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface RequestFeedbackModalProps {
  orgId: string;
  requesterId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RequestFeedbackModal({
  orgId,
  requesterId,
  open,
  onClose,
  onSuccess,
}: RequestFeedbackModalProps) {
  const [recipientId, setRecipientId] = useState("");
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
      .neq("user_id", requesterId)
      .then(({ data: rows }) => {
        const ids = (rows ?? []).map((r) => r.user_id);
        if (ids.length === 0) return;
        return supabase.from("profiles").select("id, full_name").in("id", ids);
      })
      .then((res) => {
        if (res?.data) setMembers(res.data);
      });
  }, [open, orgId, requesterId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipientId) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Sessão expirada.");
      setLoading(false);
      return;
    }
    const { error: err } = await supabase.from("feedback_requests").insert({
      org_id: orgId,
      requester_id: user.id,
      recipient_id: recipientId,
      status: "pending",
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSuccess();
    setRecipientId("");
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-neutral-900">
          Solicitar feedback
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Escolha um colega para solicitar um feedback.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="recipient"
              className="block text-sm font-medium text-neutral-700"
            >
              Solicitar para
            </label>
            <select
              id="recipient"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
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
              {loading ? "Enviando…" : "Solicitar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
