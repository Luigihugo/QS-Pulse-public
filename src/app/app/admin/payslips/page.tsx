import { redirect } from "next/navigation";
import { getCurrentOrg, canAccessAdminPanel } from "@/lib/org";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PayslipManager } from "./PayslipManager";

export type MemberPayslipRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  payslip: { id: string; file_path: string } | null;
};

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default async function AdminPayslipsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const org = await getCurrentOrg();
  const user = await getCurrentUser();
  if (!org || !user) redirect("/login");
  if (!canAccessAdminPanel(org.role)) redirect("/app");

  const params = await searchParams;
  const now = new Date();
  const selectedYear = params.year ? parseInt(params.year, 10) : now.getFullYear();
  const selectedMonth = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;

  const supabase = await createClient();

  // Todos os membros da org
  const { data: orgMembers } = await supabase
    .from("org_members")
    .select("user_id, role")
    .eq("org_id", org.id)
    .order("role", { ascending: true });

  const memberIds = (orgMembers ?? []).map((m) => m.user_id);

  // Nomes dos membros
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", memberIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  // Emails via admin client
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
    // Admin client não configurado
  }

  // Holerites do mês selecionado
  const { data: payslips } = await supabase
    .from("payslips")
    .select("id, user_id, file_path")
    .eq("org_id", org.id)
    .eq("year", selectedYear)
    .eq("month", selectedMonth);

  const payslipByUser = new Map(
    (payslips ?? []).map((p) => [p.user_id, { id: p.id, file_path: p.file_path }])
  );

  const roleOrder: Record<string, number> = {
    owner: 0, admin: 1, hr: 2, manager: 3, employee: 4,
  };

  const rows: MemberPayslipRow[] = (orgMembers ?? [])
    .sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9))
    .map((m) => ({
      user_id: m.user_id,
      full_name: profileMap.get(m.user_id) ?? null,
      email: emailMap.get(m.user_id) ?? null,
      role: m.role,
      payslip: payslipByUser.get(m.user_id) ?? null,
    }));

  const withPayslip = rows.filter((r) => r.payslip !== null).length;
  const withoutPayslip = rows.length - withPayslip;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Gestão de Holerites
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Envie, confira e baixe holerites da equipe. Filtre por mês para ver quem está faltando.
        </p>
      </div>

      <PayslipManager
        orgId={org.id}
        rows={rows}
        months={MONTHS}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        withPayslip={withPayslip}
        withoutPayslip={withoutPayslip}
        totalMembers={rows.length}
      />
    </div>
  );
}
