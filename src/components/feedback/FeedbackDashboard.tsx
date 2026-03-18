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

  const radarPayload = initialRadarData.map((d) => ({
    ...d,
    fullMark: 5,
  }));

  const hasEnoughData = initialMonthlyData.some(
    (m) => m.recebidos > 0 || m.enviados > 0
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Feedbacks
          </h1>
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

      {/* Dados do período */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Dados do período
        </h2>
        <p className="mt-0.5 text-sm text-neutral-400">
          Feedbacks enviados e recebidos no período selecionado.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm transition hover:shadow-[0_0_30px_rgba(39,255,200,0.08)]">
            <div>
              <p className="text-sm font-medium text-neutral-500">
                Feedbacks recebidos
              </p>
              <p className="mt-1 text-3xl font-bold text-[#0d0a14]">
                {initialReceivedCount}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#27FFC8]/15 text-[#27FFC8]">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm transition hover:shadow-[0_0_30px_rgba(82,39,255,0.08)]">
            <div>
              <p className="text-sm font-medium text-neutral-500">
                Feedbacks enviados
              </p>
              <p className="mt-1 text-3xl font-bold text-[#0d0a14]">
                {initialSentCount}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5227FF]/15 text-[#5227FF]">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Resumo por item (radar) */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5227FF]/10 text-[#5227FF]">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-neutral-900">Resumo por item</h3>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Feedbacks recebidos vs média (0,5 a 5,0)
          </p>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarPayload}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 5]}
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name="Seus feedbacks"
                  dataKey="me"
                  stroke="#27FFC8"
                  fill="#27FFC8"
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
                <Radar
                  name="Média da empresa"
                  dataKey="company"
                  stroke="#5227FF"
                  fill="#5227FF"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resumo mensal */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF9FFC]/15 text-[#B19EEF]">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-neutral-900">
              Resumo mensal (enviados e recebidos)
            </h3>
          </div>
          <div className="mt-4 h-[280px]">
            {hasEnoughData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={initialMonthlyData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="recebidos"
                    name="Recebidos"
                    fill="#27FFC8"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="enviados"
                    name="Enviados"
                    fill="#5227FF"
                    radius={[4, 4, 0, 0]}
                  />
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
        open={openSend}
        onClose={() => setOpenSend(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
