import { getCurrentOrg } from "@/lib/org";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FeedbackDashboard } from "@/components/feedback/FeedbackDashboard";
import { FEEDBACK_DIMENSIONS } from "@/types/database";

export type FeedbackListItem = {
  id: string;
  created_at: string;
  content: string | null;
  is_anonymous: boolean;
  in_person: boolean;
  template_name: string | null;
  otherUser: { full_name: string | null } | null;
  scores: { dimension_key: string; score: number }[];
};

export type PendingFeedbackRequestItem = {
  id: string;
  requester_id: string;
  requester_name: string | null;
  message: string | null;
  created_at: string;
};

export type FeedbackRequestHistoryItem = {
  id: string;
  status: "pending" | "completed";
  message: string | null;
  created_at: string;
  requester: { id: string; full_name: string | null } | null;
  recipient: { id: string; full_name: string | null } | null;
};

type SentFeedbackRow = {
  id: string;
  created_at: string;
  about_user_id: string;
  content?: string | null;
  is_anonymous?: boolean | null;
  in_person?: boolean | null;
  template_id?: string | null;
};

type ReceivedFeedbackRow = {
  id: string;
  created_at: string;
  from_user_id: string;
  content?: string | null;
  is_anonymous?: boolean | null;
  in_person?: boolean | null;
  template_id?: string | null;
};

type RequestRow = {
  id: string;
  requester_id: string;
  message?: string | null;
  created_at: string;
};

type RequestHistoryRow = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: "pending" | "completed";
  message?: string | null;
  created_at: string;
};

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
  let sentFeedbacks: FeedbackListItem[] = [];
  let receivedFeedbacks: FeedbackListItem[] = [];
  let pendingRequests: PendingFeedbackRequestItem[] = [];
  let sentRequestHistory: FeedbackRequestHistoryItem[] = [];
  let receivedRequestHistory: FeedbackRequestHistoryItem[] = [];

  try {
    // Contagens
    const [{ count: received }, { count: sent }] = await Promise.all([
      supabase
        .from("feedbacks")
        .select("*", { count: "exact", head: true })
        .eq("about_user_id", user.id)
        .gte("created_at", startDefault.toISOString())
        .lte("created_at", endDefault.toISOString()),
      supabase
        .from("feedbacks")
        .select("*", { count: "exact", head: true })
        .eq("from_user_id", user.id)
        .gte("created_at", startDefault.toISOString())
        .lte("created_at", endDefault.toISOString()),
    ]);
    receivedCount = received ?? 0;
    sentCount = sent ?? 0;

    // Radar: médias dos feedbacks recebidos no período
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
      radarData = FEEDBACK_DIMENSIONS.map((d) => ({
        dimension: d.key, label: d.label, me: 0, company: 0,
      }));
    }

    // Gráfico mensal
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

    // Lista de feedbacks ENVIADOS pelo usuário logado
    let sentRows: SentFeedbackRow[] | null = null;
    const sentRich = await supabase
      .from("feedbacks")
      .select("id, created_at, about_user_id, content, is_anonymous, in_person, template_id")
      .eq("from_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (sentRich.error) {
      const sentFallback = await supabase
        .from("feedbacks")
        .select("id, created_at, about_user_id")
        .eq("from_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      sentRows = (sentFallback.data as SentFeedbackRow[] | null) ?? [];
    } else {
      sentRows = (sentRich.data as SentFeedbackRow[] | null) ?? [];
    }

    if (sentRows && sentRows.length > 0) {
      const aboutIds = Array.from(new Set(sentRows.map((r) => r.about_user_id)));
      const { data: aboutProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", aboutIds);
      const aboutMap = new Map((aboutProfiles ?? []).map((p) => [p.id, p]));

      const sentIds = sentRows.map((r) => r.id);
      const templateIds = Array.from(
        new Set(sentRows.map((r) => r.template_id).filter(Boolean))
      ) as string[];
      const { data: templates } = templateIds.length
        ? await supabase
            .from("feedback_templates")
            .select("id, name")
            .in("id", templateIds)
        : { data: [] as { id: string; name: string }[] };
      const templateMap = new Map((templates ?? []).map((t) => [t.id, t.name]));
      const { data: sentScores } = await supabase
        .from("feedback_scores")
        .select("feedback_id, dimension_key, score")
        .in("feedback_id", sentIds);
      const sentScoreMap = new Map<string, { dimension_key: string; score: number }[]>();
      for (const s of sentScores ?? []) {
        const arr = sentScoreMap.get(s.feedback_id) ?? [];
        arr.push({ dimension_key: s.dimension_key, score: Number(s.score) });
        sentScoreMap.set(s.feedback_id, arr);
      }

      sentFeedbacks = sentRows.map((r) => ({
        id: r.id,
        created_at: r.created_at,
        content: r.content ?? null,
        is_anonymous: Boolean(r.is_anonymous),
        in_person: Boolean(r.in_person),
        template_name: r.template_id ? templateMap.get(r.template_id) ?? null : null,
        otherUser: aboutMap.get(r.about_user_id) ?? null,
        scores: sentScoreMap.get(r.id) ?? [],
      }));
    }

    // Lista de feedbacks RECEBIDOS pelo usuário logado
    let receivedRows: ReceivedFeedbackRow[] | null = null;
    const receivedRich = await supabase
      .from("feedbacks")
      .select("id, created_at, from_user_id, content, is_anonymous, in_person, template_id")
      .eq("about_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (receivedRich.error) {
      const receivedFallback = await supabase
        .from("feedbacks")
        .select("id, created_at, from_user_id")
        .eq("about_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      receivedRows = (receivedFallback.data as ReceivedFeedbackRow[] | null) ?? [];
    } else {
      receivedRows = (receivedRich.data as ReceivedFeedbackRow[] | null) ?? [];
    }

    if (receivedRows && receivedRows.length > 0) {
      const fromIds = Array.from(new Set(receivedRows.map((r) => r.from_user_id)));
      const { data: fromProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", fromIds);
      const fromMap = new Map((fromProfiles ?? []).map((p) => [p.id, p]));

      const receivedIds = receivedRows.map((r) => r.id);
      const templateIds = Array.from(
        new Set(receivedRows.map((r) => r.template_id).filter(Boolean))
      ) as string[];
      const { data: templates } = templateIds.length
        ? await supabase
            .from("feedback_templates")
            .select("id, name")
            .in("id", templateIds)
        : { data: [] as { id: string; name: string }[] };
      const templateMap = new Map((templates ?? []).map((t) => [t.id, t.name]));
      const { data: receivedScores } = await supabase
        .from("feedback_scores")
        .select("feedback_id, dimension_key, score")
        .in("feedback_id", receivedIds);
      const receivedScoreMap = new Map<string, { dimension_key: string; score: number }[]>();
      for (const s of receivedScores ?? []) {
        const arr = receivedScoreMap.get(s.feedback_id) ?? [];
        arr.push({ dimension_key: s.dimension_key, score: Number(s.score) });
        receivedScoreMap.set(s.feedback_id, arr);
      }

      receivedFeedbacks = receivedRows.map((r) => ({
        id: r.id,
        created_at: r.created_at,
        content: r.content ?? null,
        is_anonymous: Boolean(r.is_anonymous),
        in_person: Boolean(r.in_person),
        template_name: r.template_id ? templateMap.get(r.template_id) ?? null : null,
        otherUser: r.is_anonymous ? { full_name: "Anônimo" } : fromMap.get(r.from_user_id) ?? null,
        scores: receivedScoreMap.get(r.id) ?? [],
      }));
    }

    let reqRows: RequestRow[] | null = null;
    const reqRich = await supabase
      .from("feedback_requests")
      .select("id, requester_id, message, created_at")
      .eq("recipient_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50);
    if (reqRich.error) {
      const reqFallback = await supabase
        .from("feedback_requests")
        .select("id, requester_id, created_at")
        .eq("recipient_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);
      reqRows = (reqFallback.data as RequestRow[] | null) ?? [];
    } else {
      reqRows = (reqRich.data as RequestRow[] | null) ?? [];
    }

    if (reqRows && reqRows.length > 0) {
      const requesterIds = Array.from(new Set(reqRows.map((r) => r.requester_id)));
      const { data: reqProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", requesterIds);
      const reqMap = new Map((reqProfiles ?? []).map((p) => [p.id, p.full_name]));
      pendingRequests = reqRows.map((r) => ({
        id: r.id,
        requester_id: r.requester_id,
        requester_name: reqMap.get(r.requester_id) ?? null,
        message: r.message ?? null,
        created_at: r.created_at,
      }));
    }

    // Histórico de solicitações que eu FIZ (requester)
    let sentReqRows: RequestHistoryRow[] | null = null;
    const sentReqRich = await supabase
      .from("feedback_requests")
      .select("id, requester_id, recipient_id, status, message, created_at")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (sentReqRich.error) {
      const sentReqFallback = await supabase
        .from("feedback_requests")
        .select("id, requester_id, recipient_id, status, created_at")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      sentReqRows = (sentReqFallback.data as RequestHistoryRow[] | null) ?? [];
    } else {
      sentReqRows = (sentReqRich.data as RequestHistoryRow[] | null) ?? [];
    }

    if (sentReqRows && sentReqRows.length > 0) {
      const recipientIds = Array.from(new Set(sentReqRows.map((r) => r.recipient_id)));
      const { data: recipientProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", recipientIds);
      const recipientMap = new Map((recipientProfiles ?? []).map((p) => [p.id, p]));

      sentRequestHistory = sentReqRows.map((r) => ({
        id: r.id,
        status: (r.status as "pending" | "completed") ?? "pending",
        message: r.message ?? null,
        created_at: r.created_at,
        requester: { id: user.id, full_name: null },
        recipient: recipientMap.get(r.recipient_id) ?? null,
      }));
    }

    // Histórico de solicitações que eu RECEBI (recipient)
    let receivedReqRows: RequestHistoryRow[] | null = null;
    const receivedReqRich = await supabase
      .from("feedback_requests")
      .select("id, requester_id, recipient_id, status, message, created_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (receivedReqRich.error) {
      const receivedReqFallback = await supabase
        .from("feedback_requests")
        .select("id, requester_id, recipient_id, status, created_at")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      receivedReqRows = (receivedReqFallback.data as RequestHistoryRow[] | null) ?? [];
    } else {
      receivedReqRows = (receivedReqRich.data as RequestHistoryRow[] | null) ?? [];
    }

    if (receivedReqRows && receivedReqRows.length > 0) {
      const requesterIds = Array.from(new Set(receivedReqRows.map((r) => r.requester_id)));
      const { data: requesterProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", requesterIds);
      const requesterMap = new Map((requesterProfiles ?? []).map((p) => [p.id, p]));

      receivedRequestHistory = receivedReqRows.map((r) => ({
        id: r.id,
        status: (r.status as "pending" | "completed") ?? "pending",
        message: r.message ?? null,
        created_at: r.created_at,
        requester: requesterMap.get(r.requester_id) ?? null,
        recipient: { id: user.id, full_name: null },
      }));
    }
  } catch {
    radarData = FEEDBACK_DIMENSIONS.map((d) => ({
      dimension: d.key, label: d.label, me: 0, company: 0,
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
      initialSentFeedbacks={sentFeedbacks}
      initialReceivedFeedbacks={receivedFeedbacks}
      initialPendingRequests={pendingRequests}
      initialSentRequestHistory={sentRequestHistory}
      initialReceivedRequestHistory={receivedRequestHistory}
    />
  );
}
