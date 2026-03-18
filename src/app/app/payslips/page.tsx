import { getCurrentOrg, canManagePayslips } from "@/lib/org";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UploadPayslipForm } from "./UploadPayslipForm";
import type { Payslip, PayslipWithProfile } from "@/types/database";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default async function PayslipsPage() {
  const org = await getCurrentOrg();
  const user = await getCurrentUser();
  if (!org || !user) redirect("/login");

  const supabase = await createClient();
  const { data: payslips } = await supabase
    .from("payslips")
    .select("*")
    .eq("org_id", org.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  const list = (payslips ?? []) as Payslip[];
  const userIds = Array.from(new Set(list.map((p) => p.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);
  const payslipsWithProfile: PayslipWithProfile[] = list.map((p) => ({
    ...p,
    profiles: profileMap.get(p.user_id) ?? null,
  }));

  const canUpload = canManagePayslips(org.role);
  const showAll = canUpload;

  let members: { user_id: string; full_name: string | null }[] = [];
  if (canUpload) {
    const { data: orgMembers } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", org.id);
    const memberIds = (orgMembers ?? []).map((m) => m.user_id);
    const { data: memberProfiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", memberIds);
    const profileMap = new Map(memberProfiles?.map((p) => [p.id, p.full_name]) ?? []);
    members = memberIds.map((id) => ({ user_id: id, full_name: profileMap.get(id) ?? null }));
  }

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Holerites</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {canUpload
          ? "Visualize e envie holerites da organização."
          : "Seus contracheques disponíveis para download."}
      </p>

      {canUpload && (
        <div className="mt-6">
          <UploadPayslipForm orgId={org.id} currentUserId={user.id} members={members} />
        </div>
      )}

      <div className="mt-8">
        {payslipsWithProfile.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 py-16 text-center">
            <p className="text-neutral-500">
              {canUpload ? "Nenhum holerite cadastrado ainda." : "Nenhum holerite disponível."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {payslipsWithProfile.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm"
              >
                <div>
                  <span className="font-medium text-neutral-900">
                    {MONTHS[p.month - 1]} / {p.year}
                  </span>
                  {showAll && p.profiles?.full_name && (
                    <span className="ml-2 text-sm text-neutral-500">
                      — {p.profiles.full_name}
                    </span>
                  )}
                </div>
                <Link
                  href={`/app/payslips/download?path=${encodeURIComponent(p.file_path)}`}
                  className="rounded-lg bg-[#0e2a47] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0e2a47]/90"
                >
                  Baixar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
