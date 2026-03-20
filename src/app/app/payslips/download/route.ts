import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path || typeof path !== "string") {
    return NextResponse.json({ error: "path obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();

  // Faz o download real do arquivo (RLS do storage valida a permissão)
  const { data: blob, error } = await supabase.storage
    .from("payslips")
    .download(path);

  if (error || !blob) {
    return NextResponse.json(
      { error: "Não autorizado ou arquivo não encontrado" },
      { status: 403 }
    );
  }

  // Extrai o nome do arquivo do path: org_id/user_id/YYYY-MM.pdf
  const segments = path.split("/");
  const rawFilename = segments[segments.length - 1] ?? "holerite.pdf";
  // Renomeia de "2025-01.pdf" para "holerite-2025-01.pdf"
  const downloadName = rawFilename.startsWith("holerite-")
    ? rawFilename
    : `holerite-${rawFilename}`;

  const arrayBuffer = await blob.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${downloadName}"`,
    },
  });
}
