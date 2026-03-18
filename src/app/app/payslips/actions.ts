"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const BUCKET = "payslips";

export type UploadResult = { ok: true } | { ok: false; error: string };

export async function uploadPayslip(formData: FormData): Promise<UploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const orgId = formData.get("org_id") as string | null;
  const userId = formData.get("user_id") as string | null;
  const year = formData.get("year") as string | null;
  const month = formData.get("month") as string | null;
  const file = formData.get("file") as File | null;

  if (!orgId || !userId || !year || !month || !file?.size) {
    return { ok: false, error: "Preencha todos os campos e selecione um PDF." };
  }

  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  if (Number.isNaN(y) || Number.isNaN(m) || m < 1 || m > 12) {
    return { ok: false, error: "Mês/ano inválidos." };
  }

  const ext = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "pdf";
  const fileName = `${y}-${String(m).padStart(2, "0")}.${ext}`;
  const filePath = `${orgId}/${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { error: dbError } = await supabase.from("payslips").upsert(
    {
      org_id: orgId,
      user_id: userId,
      year: y,
      month: m,
      file_path: filePath,
      uploaded_by: user.id,
    },
    { onConflict: "org_id,user_id,year,month" }
  );

  if (dbError) {
    return { ok: false, error: dbError.message };
  }

  revalidatePath("/app/payslips");
  return { ok: true };
}
