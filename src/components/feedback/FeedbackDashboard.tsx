"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { RequestFeedbackModal } from "./RequestFeedbackModal";
import { SendFeedbackModal } from "./SendFeedbackModal";
import { FEEDBACK_DIMENSIONS } from "@/types/database";
import type {
  FeedbackListItem,
  FeedbackRequestHistoryItem,
  PendingFeedbackRequestItem,
} from "@/app/app/feedback/page";

type RadarPoint = { dimension: string; label: string; me: number; company: number };
type MonthlyPoint = { month: string; recebidos: number; enviados: number };

interface FeedbackDashboardProps {
  orgId: string;
  userId: string;
  initialReceivedCount: number;
  initialSentCount: number;
  initialRadarData: RadarPoint[];
  initialMonthlyData: MonthlyPoint[];
  defaultDateStart: string;
  defaultDateEnd: string;
  initialSentFeedbacks: FeedbackListItem[];
  initialReceivedFeedbacks: FeedbackListItem[];
  initialPendingRequests: PendingFeedbackRequestItem[];
  initialSentRequestHistory: FeedbackRequestHistoryItem[];
  initialReceivedRequestHistory: FeedbackRequestHistoryItem[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 4 ? "bg-emerald-50 text-emerald-700" :
    score >= 2.5 ? "bg-yellow-50 text-yellow-700" :
    "bg-red-50 text-red-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      {score.toFixed(1)}
    </span>
  );
}

function RequestStatusBadge({ status }: { status: "pending" | "completed" }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        Respondido
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
      Pendente
    </span>
  );
}

function FeedbackCard({
  item,
  direction,
}: {
  item: FeedbackListItem;
  direction: "sent" | "received";
}) {
  const [open, setOpen] = useState(false);
  const label = direction === "sent" ? "Para" : "De";
  const name = item.otherUser?.full_name ?? "Colaborador";

  const dimMap = new Map(FEEDBACK_DIMENSIONS.map((d) => [d.key, d.label]));

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5227FF] to-[#27FFC8] text-xs font-semibold text-white">
            {name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">
              <span className="text-neutral-400 font-normal">{label}: </span>
              {name}
            </p>
            <p className="text-xs text-neutral-400">{formatDate(item.created_at)}</p>
          </div>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-neutral-100 px-4 py-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {item.scores.map((s) => (
              <div key={s.dimension_key} className="flex items-center justify-between gap-2">
                <span className="text-xs text-neutral-600 truncate">
                  {dimMap.get(s.dimension_key) ?? s.dimension_key}
                </span>
                <ScoreBadge score={s.score} />
              </div>
            ))}
          </div>
          {item.scores.length === 0 && (
            <p className="text-xs text-neutral-400">Sem notas registradas.</p>
          )}
          {(item.template_name || item.in_person || item.content) && (
            <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
              {item.template_name && (
                <p className="text-xs text-neutral-500">
                  <span className="font-medium text-neutral-700">Modelo:</span>{" "}
                  {item.template_name}
                </p>
              )}
              {item.in_person && (
                <p className="text-xs text-neutral-500">
                  <span className="font-medium text-neutral-700">Tipo:</span> Feedback presencial
                </p>
              )}
              {item.content && (
                <p className="text-xs whitespace-pre-line text-neutral-600">{item.content}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FeedbackDashboard({
  orgId,
  userId,
  initialReceivedCount,
  initialSentCount,
  initialRadarData,
  initialMonthlyData,
  defaultDateStart,
  defaultDateEnd,
  initialSentFeedbacks,
  initialReceivedFeedbacks,
  initialPendingRequests,
  initialSentRequestHistory,
  initialReceivedRequestHistory,
}: FeedbackDashboardProps) {
  const router = useRouter();
  const [dateStart, setDateStart] = useState(defaultDateStart);
  const [dateEnd, setDateEnd] = useState(defaultDateEnd);
  const [openRequest, setOpenRequest] = useState(false);
  const [openSend, setOpenSend] = useState(false);

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (dateStart) params.set("start", dateStart);
    if (dateEnd) params.set("end", dateEnd);
    router.push(`/app/feedback?${params.toString()}`);
  };

  const handleClear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      .toISOString()
      .slice(0, 10);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
    setDateStart(start);
    setDateEnd(end);
    router.push("/app/feedback");
  };

  const radarPayload = initialRadarData.map((d) => ({ ...d, fullMark: 5 }));
  const hasEnoughData = initialMonthlyData.some((m) => m.recebidos > 0 || m.enviados > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Feedbacks</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Dê, solicite e receba feedbacks de forma confidencial e construtiva.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpenRequest(true)}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-[#27FFC8]/50 hover:bg-neutral-50"
          >
            Solicitar feedback
          </button>
          <button
            type="button"
            onClick={() => setOpenSend(true)}
            className="rounded-xl bg-[#27FFC8] px-4 py-2.5 text-sm font-semibold text-[#0d0a14] shadow-[0_0_20px_rgba(39,255,200,0.3)] transition hover:bg-[#22e6b5]"
          >
            Enviar feedback
          </button>
        </div>
      </div>

      {/* Filtro por data */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white/80 p-4 shadow-sm">
        <span className="text-sm font-medium text-neutral-600">Período</span>
        <input
          type="date"
          value={dateStart}
          onChange={(e) => setDateStart(e.target.value)}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={dateEnd}
          onChange={(e) => setDateEnd(e.target.value)}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={handleFilter}
          className="rounded-lg bg-[#5227FF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#4520e0]"
        >
          Filtrar
        </button>
      </div>

      {/* Contadores */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Dados do período
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-medium text-neutral-500">Feedbacks recebidos</p>
              <p className="mt-1 text-3xl font-bold text-[#0d0a14]">{initialReceivedCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#27FFC8]/15 text-[#27FFC8]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-medium text-neutral-500">Feedbacks enviados</p>
              <p className="mt-1 text-3xl font-bold text-[#0d0a14]">{initialSentCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5227FF]/15 text-[#5227FF]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-neutral-900">Resumo por dimensão</h3>
          <p className="mt-0.5 text-xs text-neutral-500">Feedbacks recebidos (0,5 a 5,0)</p>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarPayload}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
                <Radar name="Seus feedbacks" dataKey="me" stroke="#27FFC8" fill="#27FFC8" fillOpacity={0.4} strokeWidth={2} />
                <Radar name="Média da empresa" dataKey="company" stroke="#5227FF" fill="#5227FF" fillOpacity={0.2} strokeWidth={2} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-neutral-900">Resumo mensal</h3>
          <div className="mt-4 h-[280px]">
            {hasEnoughData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={initialMonthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }} />
                  <Legend />
                  <Bar dataKey="recebidos" name="Recebidos" fill="#27FFC8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="enviados" name="Enviados" fill="#5227FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl bg-neutral-50/80 text-sm text-neutral-500">
                Sem feedbacks suficientes para análise no período.
              </div>
            )}
          </div>
        </div>
      </div>

      {initialPendingRequests.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Solicitações pendentes para você
          </h2>
          <div className="space-y-2">
            {initialPendingRequests.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3"
              >
                <p className="text-sm text-neutral-800">
                  <span className="font-semibold">{r.requester_name ?? "Colaborador"}</span>{" "}
                  solicitou seu feedback.
                </p>
                {r.message && <p className="mt-1 text-xs text-neutral-600">{r.message}</p>}
                <p className="mt-1 text-[11px] text-neutral-400">{formatDate(r.created_at)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rastreabilidade de solicitações */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Solicitações que você fez
          </h2>
          {initialSentRequestHistory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 py-10 text-center text-sm text-neutral-400">
              Você ainda não solicitou feedback.
            </div>
          ) : (
            <div className="space-y-2">
              {initialSentRequestHistory.map((item) => (
                <div key={item.id} className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-neutral-800">
                      Para <span className="font-semibold">{item.recipient?.full_name ?? "Colaborador"}</span>
                    </p>
                    <RequestStatusBadge status={item.status} />
                  </div>
                  {item.message && (
                    <p className="mt-1 line-clamp-2 text-xs text-neutral-600">{item.message}</p>
                  )}
                  <p className="mt-1 text-[11px] text-neutral-400">{formatDate(item.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Solicitações que você recebeu
          </h2>
          {initialReceivedRequestHistory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 py-10 text-center text-sm text-neutral-400">
              Nenhuma solicitação recebida ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {initialReceivedRequestHistory.map((item) => (
                <div key={item.id} className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-neutral-800">
                      De <span className="font-semibold">{item.requester?.full_name ?? "Colaborador"}</span>
                    </p>
                    <RequestStatusBadge status={item.status} />
                  </div>
                  {item.message && (
                    <p className="mt-1 line-clamp-2 text-xs text-neutral-600">{item.message}</p>
                  )}
                  <p className="mt-1 text-[11px] text-neutral-400">{formatDate(item.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Listas enviados / recebidos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enviados */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Feedbacks que você enviou
          </h2>
          {initialSentFeedbacks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 py-10 text-center text-sm text-neutral-400">
              Nenhum feedback enviado ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {initialSentFeedbacks.map((item) => (
                <FeedbackCard key={item.id} item={item} direction="sent" />
              ))}
            </div>
          )}
        </section>

        {/* Recebidos */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Feedbacks que você recebeu
          </h2>
          {initialReceivedFeedbacks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 py-10 text-center text-sm text-neutral-400">
              Nenhum feedback recebido ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {initialReceivedFeedbacks.map((item) => (
                <FeedbackCard key={item.id} item={item} direction="received" />
              ))}
            </div>
          )}
        </section>
      </div>

      <RequestFeedbackModal
        orgId={orgId}
        requesterId={userId}
        open={openRequest}
        onClose={() => setOpenRequest(false)}
        onSuccess={() => router.refresh()}
      />
      <SendFeedbackModal
        orgId={orgId}
        fromUserId={userId}
        pendingRequests={initialPendingRequests}
        open={openSend}
        onClose={() => setOpenSend(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
