import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentOrg, canAccessAdminPanel } from "@/lib/org";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const org = await getCurrentOrg();
  const user = await getCurrentUser();
  if (!org || !user) redirect("/login");
  if (!canAccessAdminPanel(org.role)) redirect("/app");

  const supabase = await createClient();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Busca paralela de todos os stats
  const [
    { count: totalMembers },
    { count: payslipsThisMonth },
    { count: feedbacksThisMonth },
    { data: recentPayslips },
    { data: orgMembersRaw },
  ] = await Promise.all([
    supabase
      .from("org_members")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id),
    supabase
      .from("payslips")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id)
      .eq("year", year)
      .eq("month", month),
    supabase
      .from("feedbacks")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id)
      .gte("created_at", new Date(year, month - 1, 1).toISOString())
      .lte("created_at", new Date(year, month, 0, 23, 59, 59).toISOString()),
    supabase
      .from("payslips")
      .select("id, user_id, year, month, created_at")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("org_members")
      .select("user_id, role")
      .eq("org_id", org.id),
  ]);

  const memberCount = totalMembers ?? 0;
  const payslipCount = payslipsThisMonth ?? 0;
  const missingPayslips = Math.max(0, memberCount - payslipCount);
  const feedbackCount = feedbacksThisMonth ?? 0;

  // Nomes dos membros para holerites recentes
  const recentUserIds = Array.from(new Set((recentPayslips ?? []).map((p) => p.user_id)));
  const { data: recentProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", recentUserIds);
  const profileMap = new Map((recentProfiles ?? []).map((p) => [p.id, p.full_name]));

  // Distribuição de roles
  const roleCount = new Map<string, number>();
  for (const m of orgMembersRaw ?? []) {
    roleCount.set(m.role, (roleCount.get(m.role) ?? 0) + 1);
  }

  const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const roleLabels: Record<string, string> = {
    owner: "Owner", admin: "Admin", hr: "RH", manager: "Gestor", employee: "Colaborador",
  };

  const coverage = memberCount > 0 ? Math.round((payslipCount / memberCount) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Dashboard — {org.name}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Visão geral da organização · {MONTHS[month - 1]}/{year}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total de membros"
          value={memberCount}
          icon={<MembersIcon />}
          color="purple"
        />
        <StatCard
          label={`Holerites — ${MONTHS[month - 1]}`}
          value={payslipCount}
          sub={`${coverage}% de cobertura`}
          icon={<PayslipStatIcon />}
          color="teal"
        />
        <StatCard
          label="Sem holerite"
          value={missingPayslips}
          sub="este mês"
          icon={<AlertIcon />}
          color={missingPayslips > 0 ? "red" : "teal"}
        />
        <StatCard
          label="Feedbacks"
          value={feedbackCount}
          sub="este mês"
          icon={<FeedbackStatIcon />}
          color="lilac"
        />
      </div>

      {/* Ações rápidas */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Ações rápidas
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <QuickAction
            href="/app/admin/payslips"
            title="Gestão de holerites"
            desc="Envie, confira quem falta e baixe em lote"
            icon={<PayslipActionIcon />}
            accent="#27FFC8"
          />
          <QuickAction
            href="/app/admin/users"
            title="Membros e convites"
            desc="Convide pessoas e gerencie funções"
            icon={<UsersActionIcon />}
            accent="#5227FF"
          />
          <QuickAction
            href="/app"
            title="Publicar no feed"
            desc="Comunicados e celebrações da equipe"
            icon={<FeedActionIcon />}
            accent="#B19EEF"
          />
        </div>
      </section>

      {/* Linha inferior: composição de roles + holerites recentes */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Composição da org */}
        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-neutral-900">Composição da equipe</h3>
          <p className="mt-0.5 text-xs text-neutral-500">Membros por função</p>
          <div className="mt-5 space-y-3">
            {["owner", "admin", "hr", "manager", "employee"].map((role) => {
              const count = roleCount.get(role) ?? 0;
              if (count === 0) return null;
              const pct = memberCount > 0 ? Math.round((count / memberCount) * 100) : 0;
              return (
                <div key={role}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-700">{roleLabels[role]}</span>
                    <span className="text-neutral-500">{count} ({pct}%)</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#5227FF] to-[#27FFC8] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {memberCount === 0 && (
              <p className="text-sm text-neutral-400">Nenhum membro ainda.</p>
            )}
          </div>
        </section>

        {/* Últimos holerites enviados */}
        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900">Últimos holerites</h3>
              <p className="mt-0.5 text-xs text-neutral-500">5 mais recentes enviados</p>
            </div>
            <Link
              href="/app/admin/payslips"
              className="text-xs font-medium text-[#5227FF] hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {(recentPayslips ?? []).length === 0 ? (
              <p className="text-sm text-neutral-400">Nenhum holerite enviado ainda.</p>
            ) : (
              (recentPayslips ?? []).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2"
                >
                  <span className="text-sm font-medium text-neutral-800">
                    {profileMap.get(p.user_id) ?? "—"}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {MONTHS[p.month - 1]}/{p.year}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Cobertura deste mês */}
          {memberCount > 0 && (
            <div className="mt-5 rounded-xl bg-neutral-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-neutral-700">Cobertura {MONTHS[month - 1]}/{year}</span>
                <span className={`font-semibold ${coverage === 100 ? "text-emerald-600" : coverage >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                  {coverage}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                <div
                  className={`h-full rounded-full transition-all ${coverage === 100 ? "bg-emerald-400" : coverage >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                  style={{ width: `${coverage}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-neutral-500">
                {payslipCount} de {memberCount} membros com holerite enviado
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ── Componentes internos ──────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, color,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ReactNode;
  color: "purple" | "teal" | "lilac" | "red";
}) {
  const colors = {
    purple: "bg-[#5227FF]/10 text-[#5227FF]",
    teal: "bg-[#27FFC8]/10 text-[#27FFC8]",
    lilac: "bg-[#B19EEF]/10 text-[#B19EEF]",
    red: "bg-red-50 text-red-500",
  };
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-neutral-500">{label}</p>
        {sub && <p className="text-[11px] text-neutral-400">{sub}</p>}
      </div>
    </div>
  );
}

function QuickAction({
  href, title, desc, icon, accent,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm transition hover:border-transparent hover:shadow-md"
      style={{ "--accent": accent } as React.CSSProperties}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition"
        style={{ background: `${accent}18`, color: accent }}
      >
        {icon}
      </div>
      <div>
        <p className="font-semibold text-neutral-900 text-sm">{title}</p>
        <p className="mt-0.5 text-xs text-neutral-500 leading-snug">{desc}</p>
      </div>
    </Link>
  );
}

// ── Ícones dos stats ──────────────────────────────────────────────────────────

function MembersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function PayslipStatIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.25a3.75 3.75 0 00-3.75-3.75h-1.5A1.5 1.5 0 0113 8.25v-1.5a3.75 3.75 0 00-3.75-3.75H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function FeedbackStatIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function PayslipActionIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h7.5c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m-7.5 0h7.5" />
    </svg>
  );
}

function UsersActionIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  );
}

function FeedActionIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
    </svg>
  );
}
