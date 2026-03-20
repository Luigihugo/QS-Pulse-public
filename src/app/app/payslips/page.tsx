import { getCurrentOrg, canManagePayslips } from "@/lib/org";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  let members: { user_id: string; full_name: string | null; email: string | null }[] = [];
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
    const nameMap = new Map(memberProfiles?.map((p) => [p.id, p.full_name]) ?? []);

    // Busca emails via admin client (nunca expostos ao cliente)
    const emailMap = new Map<string, string>();
    try {
      const admin = createAdminClient();
      await Promise.all(
        memberIds.map(async (id) => {
          const { data } = await admin.auth.admin.getUserById(id);
          if (data.user?.email) emailMap.set(id, data.user.email);
        })
      );
    } catch {
      // Admin client não configurado — continua sem email
    }

    members = memberIds.map((id) => ({
      user_id: id,
      full_name: nameMap.get(id) ?? null,
      email: emailMap.get(id) ?? null,
    }));
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
                  {canUpload && p.profiles?.full_name && (
                    <span className="ml-2 text-sm text-neutral-500">
                      — {p.profiles.full_name}
                    </span>
                  )}
                </div>
                <Link
                  href={`/app/payslips/download?path=${encodeURIComponent(p.file_path)}`}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0e2a47] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0e2a47]/90 transition"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Baixar PDF
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
