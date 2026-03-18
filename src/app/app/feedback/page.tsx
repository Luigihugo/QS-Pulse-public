import { getCurrentOrg } from "@/lib/org";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FeedbackDashboard } from "@/components/feedback/FeedbackDashboard";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const org = await getCurrentOrg();
  const user = await getCurrentUser();
  if (!org || !user) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const startDefault = params.start
    ? new Date(params.start + "T00:00:00")
    : new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const endDefault = params.end
    ? new Date(params.end + "T23:59:59")
    : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const supabase = await createClient();

  let receivedCount = 0;
  let sentCount = 0;
  let radarData: { dimension: string; label: string; me: number; company: number }[] = [];
  let monthlyData: { month: string; recebidos: number; enviados: number }[] = [];

  try {
    const { count: received } = await supabase
      .from("feedbacks")
      .select("*", { count: "exact", head: true })
      .eq("about_user_id", user.id)
      .gte("created_at", startDefault.toISOString())
      .lte("created_at", endDefault.toISOString());
    receivedCount = received ?? 0;

    const { count: sent } = await supabase
      .from("feedbacks")
      .select("*", { count: "exact", head: true })
      .eq("from_user_id", user.id)
      .gte("created_at", startDefault.toISOString())
      .lte("created_at", endDefault.toISOString());
    sentCount = sent ?? 0;

    const { data: myFeedbacks } = await supabase
      .from("feedbacks")
      .select("id")
      .eq("about_user_id", user.id)
      .gte("created_at", startDefault.toISOString())
      .lte("created_at", endDefault.toISOString());

    const feedbackIds = (myFeedbacks ?? []).map((f) => f.id);
    if (feedbackIds.length > 0) {
      const { data: scores } = await supabase
        .from("feedback_scores")
        .select("feedback_id, dimension_key, score")
        .in("feedback_id", feedbackIds);

      const { FEEDBACK_DIMENSIONS } = await import("@/types/database");
      const byDim = new Map<string, number[]>();
      for (const s of scores ?? []) {
        const arr = byDim.get(s.dimension_key) ?? [];
        arr.push(Number(s.score));
        byDim.set(s.dimension_key, arr);
      }
      radarData = FEEDBACK_DIMENSIONS.map((d) => {
        const vals = byDim.get(d.key) ?? [];
        const me = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        return { dimension: d.key, label: d.label, me: Math.round(me * 10) / 10, company: 0 };
      });
    } else {
      const { FEEDBACK_DIMENSIONS } = await import("@/types/database");
      radarData = FEEDBACK_DIMENSIONS.map((d) => ({
        dimension: d.key,
        label: d.label,
        me: 0,
        company: 0,
      }));
    }

    const { data: allInPeriod } = await supabase
      .from("feedbacks")
      .select("created_at, from_user_id, about_user_id")
      .or(`from_user_id.eq.${user.id},about_user_id.eq.${user.id}`)
      .gte("created_at", startDefault.toISOString())
      .lte("created_at", endDefault.toISOString());

    const monthCounts = new Map<string, { recebidos: number; enviados: number }>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthCounts.set(key, { recebidos: 0, enviados: 0 });
    }
    for (const row of allInPeriod ?? []) {
      const d = new Date(row.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const cur = monthCounts.get(key) ?? { recebidos: 0, enviados: 0 };
      if (row.about_user_id === user.id) cur.recebidos += 1;
      if (row.from_user_id === user.id) cur.enviados += 1;
      monthCounts.set(key, cur);
    }
    monthlyData = Array.from(monthCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, v]) => ({
        month: key.slice(5) + "/" + key.slice(2, 4),
        recebidos: v.recebidos,
        enviados: v.enviados,
      }));
  } catch {
    const { FEEDBACK_DIMENSIONS } = await import("@/types/database");
    radarData = FEEDBACK_DIMENSIONS.map((d) => ({
      dimension: d.key,
      label: d.label,
      me: 0,
      company: 0,
    }));
  }

  return (
    <FeedbackDashboard
      orgId={org.id}
      userId={user.id}
      initialReceivedCount={receivedCount}
      initialSentCount={sentCount}
      initialRadarData={radarData}
      initialMonthlyData={monthlyData}
      defaultDateStart={startDefault.toISOString().slice(0, 10)}
      defaultDateEnd={endDefault.toISOString().slice(0, 10)}
    />
  );
}
