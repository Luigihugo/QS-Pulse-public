"use client";

import { useState } from "react";
import { uploadPayslip, type UploadResult } from "./actions";

type Member = { user_id: string; full_name: string | null; email: string | null };

export function UploadPayslipForm({
  orgId,
  members,
}: {
  orgId: string;
  currentUserId: string;
  members: Member[];
}) {
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    const formData = new FormData(e.currentTarget);
    const res = await uploadPayslip(formData);
    setResult(res);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
    }
  }

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  function memberLabel(m: Member): string {
    if (m.full_name && m.email) return `${m.full_name} — ${m.email}`;
    if (m.full_name) return m.full_name;
    if (m.email) return m.email;
    return m.user_id;
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900">Enviar holerite</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <input type="hidden" name="org_id" value={orgId} />

        <div>
          <label htmlFor="user_id" className="block text-sm font-medium text-neutral-700">
            Colaborador
          </label>
          <select
            id="user_id"
            name="user_id"
            required
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          >
            <option value="">Selecione</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {memberLabel(m)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-400">
            Identificação por e-mail — independente do nome de perfil.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-neutral-700">
              Ano
            </label>
            <select
              id="year"
              name="year"
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-neutral-700">
              Mês
            </label>
            <select
              id="month"
              name="month"
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString("pt-BR", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-neutral-700">
            Arquivo PDF
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="application/pdf"
            required
            className="mt-1 block w-full text-sm text-neutral-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#0e2a47] file:px-3 file:py-1.5 file:text-sm file:text-white file:cursor-pointer"
          />
        </div>

        {result && !result.ok && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{result.error}</p>
        )}
        {result?.ok && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Holerite enviado com sucesso.
          </p>
        )}

        <button
          type="submit"
          className="rounded-lg bg-[#0e2a47] px-4 py-2 text-sm font-medium text-white hover:bg-[#0e2a47]/90 transition"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
