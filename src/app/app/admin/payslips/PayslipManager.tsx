"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadPayslip } from "@/app/app/payslips/actions";
import type { MemberPayslipRow } from "./page";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner", admin: "Admin", hr: "RH", manager: "Gestor", employee: "Colaborador",
};

interface PayslipManagerProps {
  orgId: string;
  rows: MemberPayslipRow[];
  months: string[];
  selectedYear: number;
  selectedMonth: number;
  withPayslip: number;
  withoutPayslip: number;
  totalMembers: number;
}

export function PayslipManager({
  orgId,
  rows,
  months,
  selectedYear,
  selectedMonth,
  withPayslip,
  withoutPayslip,
  totalMembers,
}: PayslipManagerProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const year = selectedYear;
  const month = selectedMonth;

  // Apenas membros com holerite podem ser selecionados para download
  const downloadableRows = rows.filter((r) => r.payslip !== null);
  const allSelected =
    downloadableRows.length > 0 &&
    downloadableRows.every((r) => selected.has(r.user_id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(downloadableRows.map((r) => r.user_id)));
    }
  }

  function toggleOne(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  }

  function navigateFilter(newYear: number, newMonth: number) {
    router.push(`/app/admin/payslips?year=${newYear}&month=${newMonth}`);
  }

  async function downloadBatch() {
    const toDownload = rows.filter(
      (r) => selected.has(r.user_id) && r.payslip !== null
    );
    if (toDownload.length === 0) return;
    setDownloading(true);

    for (const row of toDownload) {
      if (!row.payslip) continue;
      const url = `/app/payslips/download?path=${encodeURIComponent(row.payslip.file_path)}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Pequeno delay entre downloads para o browser não bloquear
      await new Promise((r) => setTimeout(r, 600));
    }
    setDownloading(false);
  }

  async function handleUpload(userId: string, file: File) {
    setUploadingFor(userId);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.set("org_id", orgId);
    formData.set("user_id", userId);
    formData.set("year", String(year));
    formData.set("month", String(month));
    formData.set("file", file);

    const result = await uploadPayslip(formData);
    setUploadingFor(null);

    if (result.ok) {
      setUploadSuccess(userId);
      startTransition(() => router.refresh());
    } else {
      setUploadError(result.error);
    }
  }

  const coverage = totalMembers > 0 ? Math.round((withPayslip / totalMembers) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Filtros + resumo */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={(e) => navigateFilter(year, Number(e.target.value))}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800"
          >
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => navigateFilter(Number(e.target.value), month)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800"
          >
            {[year + 1, year, year - 1, year - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {withPayslip} enviados
          </span>
          <span className="flex items-center gap-1.5 text-red-500">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            {withoutPayslip} faltando
          </span>
          <span className="font-semibold text-neutral-700">{coverage}%</span>
        </div>
      </div>

      {/* Barra de ações do lote */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-[#27FFC8]/30 bg-[#27FFC8]/5 px-4 py-3">
          <span className="text-sm font-medium text-neutral-700">
            {selected.size} {selected.size === 1 ? "holerite selecionado" : "holerites selecionados"}
          </span>
          <button
            type="button"
            onClick={downloadBatch}
            disabled={downloading}
            className="flex items-center gap-2 rounded-xl bg-[#0e2a47] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2a47]/90 disabled:opacity-60"
          >
            {downloading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Baixando…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Baixar lote
              </>
            )}
          </button>
        </div>
      )}

      {uploadError && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{uploadError}</p>
      )}

      {/* Tabela */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-neutral-300 accent-[#5227FF]"
                  title="Selecionar todos com holerite"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Colaborador</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600 hidden sm:table-cell">Função</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-600">Ação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hasPayslip = row.payslip !== null;
              const isUploading = uploadingFor === row.user_id;
              const isSuccess = uploadSuccess === row.user_id;

              return (
                <tr
                  key={row.user_id}
                  className="border-b border-neutral-100 last:border-0 transition hover:bg-neutral-50/60"
                >
                  {/* Checkbox — só se tiver holerite */}
                  <td className="px-4 py-3">
                    {hasPayslip ? (
                      <input
                        type="checkbox"
                        checked={selected.has(row.user_id)}
                        onChange={() => toggleOne(row.user_id)}
                        className="h-4 w-4 rounded border-neutral-300 accent-[#5227FF]"
                      />
                    ) : (
                      <span className="block h-4 w-4" />
                    )}
                  </td>

                  {/* Colaborador */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">
                      {row.full_name ?? "Sem nome"}
                    </p>
                    {row.email && (
                      <p className="text-xs text-neutral-400">{row.email}</p>
                    )}
                  </td>

                  {/* Função */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="inline-flex items-center rounded-full border border-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                      {ROLE_LABELS[row.role] ?? row.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {isSuccess ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        ✓ Enviado
                      </span>
                    ) : hasPayslip ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        ✓ Disponível
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                        ✗ Faltando
                      </span>
                    )}
                  </td>

                  {/* Ação */}
                  <td className="px-4 py-3 text-right">
                    {hasPayslip ? (
                      <a
                        href={`/app/payslips/download?path=${encodeURIComponent(row.payslip!.file_path)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Baixar
                      </a>
                    ) : (
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#0e2a47] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#0e2a47]/90">
                        {isUploading ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                        )}
                        {isUploading ? "Enviando…" : "Enviar PDF"}
                        <input
                          type="file"
                          accept="application/pdf"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(row.user_id, file);
                          }}
                        />
                      </label>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="py-16 text-center text-sm text-neutral-400">
            Nenhum membro na organização.
          </div>
        )}
      </div>

      <p className="text-xs text-neutral-400">
        O download em lote salva um PDF por colaborador. Certifique-se de que o seu navegador permite múltiplos downloads automáticos.
      </p>
    </div>
  );
}
