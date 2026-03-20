-- Feedback V2: mais contexto e templates

-- Solicitações com mensagem opcional
ALTER TABLE feedback_requests
  ADD COLUMN IF NOT EXISTS message text;

-- Feedback enviado com campos ricos
ALTER TABLE feedbacks
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_id uuid,
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS in_person boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS internal_notes text;

-- Templates de feedback por organização
CREATE TABLE IF NOT EXISTS feedback_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  prompt text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_templates_org ON feedback_templates(org_id);

-- Vincular template no feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'feedbacks'
      AND constraint_name = 'feedbacks_template_id_fkey'
  ) THEN
    ALTER TABLE feedbacks
      ADD CONSTRAINT feedbacks_template_id_fkey
      FOREIGN KEY (template_id) REFERENCES feedback_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- RLS feedback_templates
ALTER TABLE feedback_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view feedback templates" ON feedback_templates;
CREATE POLICY "Members can view feedback templates"
  ON feedback_templates FOR SELECT
  USING (public.current_user_is_org_member(org_id));

DROP POLICY IF EXISTS "HR and above can create feedback templates" ON feedback_templates;
CREATE POLICY "HR and above can create feedback templates"
  ON feedback_templates FOR INSERT
  WITH CHECK (
    public.current_user_is_org_member(org_id)
    AND public.current_user_has_org_role(org_id, ARRAY['owner'::org_role, 'admin'::org_role, 'hr'::org_role])
  );

-- Seed templates padrão para organizações já existentes
INSERT INTO feedback_templates (org_id, name, description, prompt)
SELECT
  o.id,
  t.name,
  t.description,
  t.prompt
FROM orgs o
CROSS JOIN (
  VALUES
    (
      'Nenhum modelo',
      'Modelo livre, escreva do seu jeito.',
      'Descreva contexto, comportamento observado, impacto e próximos passos.'
    ),
    (
      'SBI (Situação, Comportamento, Impacto)',
      'Estrutura objetiva e prática.',
      'Situação: ...\nComportamento: ...\nImpacto: ...'
    ),
    (
      'Comunicação Não Violenta',
      'Observação, sentimento, necessidade e pedido.',
      'Observação: ...\nSentimento: ...\nNecessidade: ...\nPedido: ...'
    ),
    (
      '1:1',
      'Para check-ins e reuniões 1:1.',
      'O que funcionou bem: ...\nO que pode melhorar: ...\nAção combinada: ...'
    )
) AS t(name, description, prompt)
WHERE NOT EXISTS (
  SELECT 1
  FROM feedback_templates ft
  WHERE ft.org_id = o.id
    AND ft.name = t.name
);
