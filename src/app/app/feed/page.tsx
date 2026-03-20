import { getCurrentOrg, canCreatePost } from "@/lib/org";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CreatePostForm } from "@/components/feed/CreatePostForm";
import { PostCard } from "@/components/feed/PostCard";
import type { PostWithAuthor } from "@/types/database";

export default async function FeedPage() {
  const org = await getCurrentOrg();
  const user = await getCurrentUser();
  if (!org || !user) return null;

  const supabase = await createClient();

  // Buscar perfil do usuário logado (para o composer)
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  const canPost = canCreatePost(org.role);

  const composer = canPost ? (
    <div className="mt-6">
      <CreatePostForm
        orgId={org.id}
        authorName={myProfile?.full_name ?? "Você"}
        authorAvatar={myProfile?.avatar_url}
      />
    </div>
  ) : null;

  if (!posts?.length) {
    return (
      <div className="mx-auto max-w-2xl pb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Feed</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Celebrações e comunicados da sua equipe.
        </p>
        {composer}
        <div className="mt-8 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 py-16 text-center">
          <p className="text-neutral-500">Nenhum post ainda. Seja o primeiro a publicar!</p>
        </div>
      </div>
    );
  }

  const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
  const postIds = posts.map((p) => p.id);

  const [profilesRes, likesRes, commentsRes, myLikesRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url").in("id", authorIds),
    supabase.from("post_likes").select("post_id").in("post_id", postIds),
    supabase.from("post_comments").select("post_id").in("post_id", postIds),
    supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const likeCountMap = new Map<string, number>();
  (likesRes.data ?? []).forEach((l) =>
    likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) ?? 0) + 1)
  );
  const commentCountMap = new Map<string, number>();
  (commentsRes.data ?? []).forEach((c) =>
    commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) ?? 0) + 1)
  );
  const myLikeSet = new Set((myLikesRes.data ?? []).map((l) => l.post_id));

  const postsWithMeta: PostWithAuthor[] = posts.map((p) => ({
    ...p,
    profiles: profileMap.get(p.author_id) ?? null,
    like_count: likeCountMap.get(p.id) ?? 0,
    comment_count: commentCountMap.get(p.id) ?? 0,
    liked_by_me: myLikeSet.has(p.id),
  }));

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Feed</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Celebrações e comunicados da sua equipe.
      </p>
      {composer}
      <ul className="mt-6 space-y-4">
        {postsWithMeta.map((post) => (
          <li key={post.id}>
            <PostCard post={post} currentUserId={user.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
