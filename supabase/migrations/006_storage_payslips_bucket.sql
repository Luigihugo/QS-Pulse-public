-- Bucket privado para holerites. Path: org_id/user_id/filename (ex: uuid/uuid/2025-01.pdf)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payslips',
  'payslips',
  false,
  5242880,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Upload: apenas hr/admin/owner da org (org_id = primeiro segmento do path)
CREATE POLICY "HR and above can upload payslips"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payslips'
  AND public.can_upload_payslip_to_org((storage.foldername(name))[1])
);

-- Download: dono do holerite (user_id = segundo segmento) ou hr/admin/owner da org
CREATE POLICY "Users can download own or org payslips"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payslips'
  AND (
    (storage.foldername(name))[2] = (SELECT auth.uid()::text)
    OR public.can_download_payslip(name)
  )
);

-- Update/Delete: mesmo critério que upload (hr/admin/owner da org)
CREATE POLICY "HR and above can update payslips"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payslips'
  AND public.can_upload_payslip_to_org((storage.foldername(name))[1])
);

CREATE POLICY "HR and above can delete payslips"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payslips'
  AND public.can_upload_payslip_to_org((storage.foldername(name))[1])
);
