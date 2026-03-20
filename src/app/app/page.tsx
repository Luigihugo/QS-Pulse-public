import Link from "next/link";
import { getCurrentOrg, canCreatePost } from "@/lib/org";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type ShortcutProps = {
  href: string;
  title: string;
  description: string;
};

function Shortcut({ href, title, description }: ShortcutProps) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-sm font-semibold text-neutral-900">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">{description}</p>
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[#0d0a14]">{value}</p>
    </div>
  );
}

export default async function CollaboratorHomePage() {
  const org = await getCurrentOrg();
  const user = await getCurrentUser();
  if (!org || !user) redirect("/login");

  const supabase = await createClient();

  let feedPosts = 0;
  let feedbackReceived = 0;
  let feedbackPending = 0;
  let payslipsTotal = 0;

  try {
    const [postsRes, receivedRes, pendingRes, payslipsRes] = await Promise.all([
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("org_id", org.id),
      supabase
        .from("feedbacks")
        .select("*", { count: "exact", head: true })
        .eq("about_user_id", user.id),
      supabase
        .from("feedback_requests")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("status", "pending"),
      supabase
        .from("payslips")
        .select("*", { count: "exact", head: true })
        .eq("org_id", org.id)
        .eq("user_id", user.id),
    ]);

    feedPosts = postsRes.count ?? 0;
    feedbackReceived = receivedRes.count ?? 0;
    feedbackPending = pendingRes.count ?? 0;
    payslipsTotal = payslipsRes.count ?? 0;
  } catch {
    // Mantém home funcional mesmo se alguma tabela estiver indisponível.
  }

  const canPost = canCreatePost(org.role);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <section className="rounded-3xl border border-[#5227FF]/15 bg-gradient-to-r from-white via-white to-[#f6f2ff] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5227FF]">
          Bem-vindo ao QS Pulse
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
          Sua central do colaborador
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600">
          Acompanhe seus feedbacks, holerites, estrutura da empresa e comunicados em um
          único lugar. Use os atalhos abaixo para acessar rapidamente o que importa no dia a dia.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Visão rápida
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Posts no feed" value={feedPosts} />
          <StatCard label="Feedbacks recebidos" value={feedbackReceived} />
          <StatCard label="Solicitações pendentes" value={feedbackPending} />
          <StatCard label="Seus holerites" value={payslipsTotal} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Acessos rápidos
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Shortcut
            href="/app/feedback"
            title="Feedback"
            description="Envie, solicite e acompanhe seu histórico completo de feedbacks."
          />
          <Shortcut
            href="/app/payslips"
            title="Meus holerites"
            description="Visualize e baixe seus holerites de forma segura."
          />
          <Shortcut
            href="/app/org-chart"
            title="Organograma"
            description="Entenda a estrutura de departamentos e times da QS."
          />
          <Shortcut
            href="/app/feed"
            title="Feed"
            description="Veja comunicados, novidades e celebrações da equipe."
          />
          <Shortcut
            href="/app/settings/profile"
            title="Meu perfil"
            description="Atualize seus dados pessoais e configurações de conta."
          />
          {canPost ? (
            <Shortcut
              href="/app/feed"
              title="Publicar comunicado"
              description="Publique uma atualização para toda a organização."
            />
          ) : (
            <Shortcut
              href="/app/feedback"
              title="Responder solicitações"
              description="Veja pedidos pendentes e mantenha seu ciclo de feedback em dia."
            />
          )}
        </div>
      </section>
    </div>
  );
}
