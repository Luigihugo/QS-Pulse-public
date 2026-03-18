-- Tabela de posts do feed (celebrações/comunicados)
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_org_created ON posts(org_id, created_at DESC);

-- Curtidas
CREATE TABLE post_likes (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX idx_post_likes_post ON post_likes(post_id);

-- Comentários
CREATE TABLE post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_comments_post ON post_comments(post_id);

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- posts: ler se membro da org; criar se hr/admin/owner; editar/apagar se autor ou admin/owner
CREATE POLICY "Members can view posts"
  ON posts FOR SELECT
  USING (public.current_user_is_org_member(org_id));

CREATE POLICY "HR and above can create posts"
  ON posts FOR INSERT
  WITH CHECK (
    public.current_user_is_org_member(org_id)
    AND public.current_user_has_org_role(org_id, ARRAY['owner'::org_role, 'admin'::org_role, 'hr'::org_role])
  );

CREATE POLICY "Author or admin can update post"
  ON posts FOR UPDATE
  USING (
    author_id = auth.uid()
    OR public.current_user_has_org_role(org_id, ARRAY['owner'::org_role, 'admin'::org_role])
  );

CREATE POLICY "Author or admin can delete post"
  ON posts FOR DELETE
  USING (
    author_id = auth.uid()
    OR public.current_user_has_org_role(org_id, ARRAY['owner'::org_role, 'admin'::org_role])
  );

-- post_likes: ver/curtir/descurtir se membro da org do post
CREATE POLICY "Members can view likes"
  ON post_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_likes.post_id AND public.current_user_is_org_member(p.org_id)
    )
  );

CREATE POLICY "Members can like"
  ON post_likes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id AND public.current_user_is_org_member(p.org_id)
    )
  );

CREATE POLICY "Users can unlike"
  ON post_likes FOR DELETE
  USING (user_id = auth.uid());

-- post_comments: ver/comentar se membro da org do post
CREATE POLICY "Members can view comments"
  ON post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_comments.post_id AND public.current_user_is_org_member(p.org_id)
    )
  );

CREATE POLICY "Members can comment"
  ON post_comments FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id AND public.current_user_is_org_member(p.org_id)
    )
  );

CREATE POLICY "Author can delete own comment"
  ON post_comments FOR DELETE
  USING (author_id = auth.uid());
