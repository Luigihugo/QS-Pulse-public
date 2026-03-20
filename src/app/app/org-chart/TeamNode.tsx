"use client";

import { useState } from "react";
import {
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  type TeamResult,
} from "./actions";
import type { TeamWithMembers } from "@/types/database";

type TeamNodeProps = {
  orgId: string;
  team: TeamWithMembers;
  allTeams: TeamWithMembers[];
  orgMembers: { user_id: string; full_name: string | null }[];
  canManage: boolean;
  depth?: number;
};

export function TeamNode({
  orgId,
  team,
  allTeams,
  orgMembers,
  canManage,
  depth = 0,
}: TeamNodeProps) {
  const [editing, setEditing] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [result, setResult] = useState<TeamResult | null>(null);
  const [editName, setEditName] = useState(team.name);
  const [editParentId, setEditParentId] = useState(team.parent_team_id ?? "");

  const availableMembers = orgMembers.filter(
    (m) => !team.members.some((tm) => tm.user_id === m.user_id)
  );

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    const res = await updateTeam(orgId, team.id, editName, editParentId || null);
    setResult(res);
    if (res.ok) {
      setEditing(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Excluir o time "${team.name}"? Sub-times e vínculos serão removidos.`)) return;
    setResult(null);
    const res = await deleteTeam(orgId, team.id);
    setResult(res);
  }

  async function handleAddMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    const formData = new FormData(e.currentTarget);
    const userId = formData.get("user_id") as string;
    const role = (formData.get("role") as string) || "member";
    if (!userId) return;
    const res = await addTeamMember(orgId, team.id, userId, role);
    setResult(res);
    if (res.ok) {
      setAddingMember(false);
      e.currentTarget.reset();
    }
  }

  async function handleRemoveMember(memberId: string) {
    setResult(null);
    const res = await removeTeamMember(orgId, memberId);
    setResult(res);
  }

  const paddingLeft = depth * 24;

  return (
    <div className="border-l-2 border-neutral-200 pl-4" style={{ marginLeft: paddingLeft }}>
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          {editing ? (
            <form onSubmit={handleUpdate} className="flex flex-1 flex-wrap items-center gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded border border-neutral-300 px-2 py-1 text-sm"
                required
              />
              <select
                value={editParentId}
                onChange={(e) => setEditParentId(e.target.value)}
                className="rounded border border-neutral-300 px-2 py-1 text-sm"
              >
                <option value="">Nenhum (departamento raiz)</option>
                {allTeams
                  .filter((t) => t.id !== team.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
              <button type="submit" className="rounded bg-[#0e2a47] px-2 py-1 text-xs text-white">
                Salvar
              </button>
              <button type="button" onClick={() => setEditing(false)} className="text-sm text-neutral-500">
                Cancelar
              </button>
            </form>
          ) : (
            <>
              <h3 className="font-semibold text-neutral-900">{team.name}</h3>
              {canManage && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="rounded px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Excluir
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingMember((a) => !a)}
                    className="rounded px-2 py-1 text-xs text-[#0e2a47] hover:bg-neutral-100"
                  >
                    + Pessoa
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {result && !result.ok && <p className="mt-2 text-xs text-red-600">{result.error}</p>}

        {addingMember && canManage && (
          <form onSubmit={handleAddMember} className="mt-3 flex flex-wrap items-center gap-2 rounded bg-neutral-50 p-2">
            <select name="user_id" required className="rounded border border-neutral-300 px-2 py-1 text-sm">
              <option value="">Selecionar pessoa</option>
              {availableMembers.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name || m.user_id}
                </option>
              ))}
            </select>
            <select name="role" className="rounded border border-neutral-300 px-2 py-1 text-sm">
              <option value="member">Membro</option>
              <option value="lead">Líder</option>
            </select>
            <button type="submit" className="rounded bg-[#0e2a47] px-2 py-1 text-xs text-white">
              Adicionar
            </button>
            <button type="button" onClick={() => setAddingMember(false)} className="text-xs text-neutral-500">
              Cancelar
            </button>
          </form>
        )}

        <ul className="mt-2 space-y-1">
          {team.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between text-sm text-neutral-600">
              <span>
                {m.full_name || m.user_id} {m.role !== "member" && `(${m.role})`}
              </span>
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(m.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remover
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {team.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {team.children.map((child) => (
            <TeamNode
              key={child.id}
              orgId={orgId}
              team={child}
              allTeams={allTeams}
              orgMembers={orgMembers}
              canManage={canManage}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
