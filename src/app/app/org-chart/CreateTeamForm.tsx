"use client";

import { useState } from "react";
import { createTeam, type TeamResult } from "./actions";
import type { TeamWithMembers } from "@/types/database";

type CreateTeamFormProps = {
  orgId: string;
  teams: TeamWithMembers[];
};

export function CreateTeamForm({ orgId, teams }: CreateTeamFormProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<TeamResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setResult(null);
    const formData = new FormData(form);
    const name = (formData.get("name") as string)?.trim() || "";
    const parentTeamId = (formData.get("parent_team_id") as string) || null;
    const res = await createTeam(orgId, name, parentTeamId || null);
    setResult(res);
    if (res.ok) {
      form?.reset();
      setOpen(false);
    }
  }

  const flatTeams = (list: TeamWithMembers[]): TeamWithMembers[] =>
    list.flatMap((t) => [t, ...flatTeams(t.children)]);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-[#0e2a47] px-4 py-2 text-sm font-medium text-white hover:bg-[#0e2a47]/90"
        >
          Novo time
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="new-team-name" className="block text-sm font-medium text-neutral-700">
              Nome do time/departamento
            </label>
            <input
              id="new-team-name"
              name="name"
              required
              className="mt-1 w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
              placeholder="Ex.: Produto"
            />
          </div>
          <div>
            <label htmlFor="new-team-parent" className="block text-sm font-medium text-neutral-700">
              Departamento/Time pai (opcional)
            </label>
            <select
              id="new-team-parent"
              name="parent_team_id"
              className="mt-1 w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
            >
              <option value="">Nenhum (departamento raiz)</option>
              {flatTeams(teams).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          {result && !result.ok && <p className="text-sm text-red-600">{result.error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-[#0e2a47] px-4 py-2 text-sm font-medium text-white hover:bg-[#0e2a47]/90"
            >
              Criar
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
