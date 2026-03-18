import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path || typeof path !== "string") {
    return NextResponse.json({ error: "path obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("payslips")
    .createSignedUrl(path, 60);

  const signedUrl = data?.signedUrl;
  if (error || !signedUrl) {
    return NextResponse.json({ error: "Não autorizado ou arquivo não encontrado" }, { status: 403 });
  }

  return NextResponse.redirect(signedUrl);
}
