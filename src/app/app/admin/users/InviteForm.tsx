"use client";

import { useState } from "react";
import { inviteUser, type InviteResult } from "./actions";
import type { OrgRole } from "@/types/database";

const ROLES: { value: OrgRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "hr", label: "RH" },
  { value: "manager", label: "Gestor" },
  { value: "employee", label: "Colaborador" },
];

export function InviteForm({ orgId }: { orgId: string }) {
  const [result, setResult] = useState<InviteResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = (formData.get("email") as string)?.trim() || "";
    const role = (formData.get("role") as OrgRole) || "employee";
    const res = await inviteUser(orgId, email, role);
    setResult(res);
    if (res.ok) form.reset();
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900">Convidar pessoa</h2>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="invite-email" className="block text-sm font-medium text-neutral-700">
            E-mail
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            placeholder="nome@empresa.com"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </div>
        <div className="w-[140px]">
          <label htmlFor="invite-role" className="block text-sm font-medium text-neutral-700">
            Função
          </label>
          <select
            id="invite-role"
            name="role"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-[#0e2a47] px-4 py-2 text-sm font-medium text-white hover:bg-[#0e2a47]/90"
        >
          Enviar convite
        </button>
      </form>
      {result && !result.ok && (
        <p className="mt-2 text-sm text-red-600">{result.error}</p>
      )}
      {result?.ok && (
        <p className="mt-2 text-sm text-green-600">Convite enviado. A pessoa receberá um e-mail para definir a senha.</p>
      )}
    </div>
  );
}
