-- Solicitação de feedback (quem pede, para quem, status)
CREATE TABLE feedback_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_requests_org ON feedback_requests(org_id);
CREATE INDEX idx_feedback_requests_recipient ON feedback_requests(recipient_id, status);
CREATE INDEX idx_feedback_requests_requester ON feedback_requests(requester_id);

-- Feedback enviado (quem deu, sobre quem, opcionalmente vinculado a uma solicitação)
CREATE TABLE feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  about_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id uuid REFERENCES feedback_requests(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedbacks_org_created ON feedbacks(org_id, created_at DESC);
CREATE INDEX idx_feedbacks_about ON feedbacks(about_user_id);
CREATE INDEX idx_feedbacks_from ON feedbacks(from_user_id);

-- Notas por dimensão (0.5 a 5.0)
CREATE TABLE feedback_scores (
  feedback_id uuid NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  dimension_key text NOT NULL,
  score numeric(2,1) NOT NULL CHECK (score >= 0.5 AND score <= 5.0),
  PRIMARY KEY (feedback_id, dimension_key)
);

CREATE INDEX idx_feedback_scores_feedback ON feedback_scores(feedback_id);

-- RLS
ALTER TABLE feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_scores ENABLE ROW LEVEL SECURITY;

-- feedback_requests: ver onde sou requester ou recipient; criar como requester; atualizar status como recipient
CREATE POLICY "Members can view own feedback requests"
  ON feedback_requests FOR SELECT
  USING (
    public.current_user_is_org_member(org_id)
    AND (requester_id = auth.uid() OR recipient_id = auth.uid())
  );

CREATE POLICY "Members can request feedback"
  ON feedback_requests FOR INSERT
  WITH CHECK (
    public.current_user_is_org_member(org_id)
    AND requester_id = auth.uid()
    AND recipient_id != auth.uid()
  );

CREATE POLICY "Recipient can update request status"
  ON feedback_requests FOR UPDATE
  USING (recipient_id = auth.uid() AND public.current_user_is_org_member(org_id))
  WITH CHECK (recipient_id = auth.uid());

-- feedbacks: ver onde dei ou recebi; inserir como from_user (sobre alguém da mesma org)
CREATE POLICY "Members can view own feedbacks"
  ON feedbacks FOR SELECT
  USING (
    public.current_user_is_org_member(org_id)
    AND (from_user_id = auth.uid() OR about_user_id = auth.uid())
  );

CREATE POLICY "Members can send feedback"
  ON feedbacks FOR INSERT
  WITH CHECK (
    public.current_user_is_org_member(org_id)
    AND from_user_id = auth.uid()
    AND about_user_id != auth.uid()
  );

-- feedback_scores: mesma visibilidade do feedback
CREATE POLICY "Members can view feedback scores"
  ON feedback_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM feedbacks f
      WHERE f.id = feedback_scores.feedback_id
        AND public.current_user_is_org_member(f.org_id)
        AND (f.from_user_id = auth.uid() OR f.about_user_id = auth.uid())
    )
  );

CREATE POLICY "Members can insert feedback scores"
  ON feedback_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM feedbacks f
      WHERE f.id = feedback_scores.feedback_id
        AND f.from_user_id = auth.uid()
        AND public.current_user_is_org_member(f.org_id)
    )
  );
