"use client";

import { useState } from "react";
import { updateMemberRole, type UpdateRoleResult } from "./actions";
import type { OrgRole } from "@/types/database";

const ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Owner",
  admin: "Admin",
  hr: "RH",
  manager: "Gestor",
  employee: "Colaborador",
};

type Member = {
  id: string;
  user_id: string;
  role: OrgRole;
  full_name: string | null;
};

export function MemberRow({
  orgId,
  member,
  currentUserId,
}: {
  orgId: string;
  member: Member;
  currentUserId: string;
}) {
  const [result, setResult] = useState<UpdateRoleResult | null>(null);
  const [busy, setBusy] = useState(false);
  const isSelf = member.user_id === currentUserId;

  async function onRoleChange(newRole: OrgRole) {
    if (newRole === member.role) return;
    setResult(null);
    setBusy(true);
    const res = await updateMemberRole(orgId, member.id, newRole);
    setResult(res);
    setBusy(false);
  }

  return (
    <tr className="border-b border-neutral-100">
      <td className="py-3 pr-4">
        <span className="font-medium text-neutral-900">
          {member.full_name || "Sem nome"}
        </span>
        {isSelf && (
          <span className="ml-2 text-xs text-neutral-500">(você)</span>
        )}
      </td>
      <td className="py-3 pr-4">
        {isSelf ? (
          <span className="text-neutral-600">{ROLE_LABELS[member.role]}</span>
        ) : (
          <select
            value={member.role}
            onChange={(e) => onRoleChange(e.target.value as OrgRole)}
            disabled={busy}
            className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 disabled:opacity-50"
          >
            {(Object.keys(ROLE_LABELS) as OrgRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className="py-3">
        {result && !result.ok && (
          <span className="text-xs text-red-600">{result.error}</span>
        )}
      </td>
    </tr>
  );
}
