import Link from "next/link";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { FluidBackground } from "@/components/FluidBackground";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <FluidBackground>
        <div className="w-full max-w-[920px] rounded-[32px] bg-white/95 px-8 py-10 shadow-xl ring-1 ring-white/60 backdrop-blur md:px-12 md:py-12">
          <div className="flex h-full flex-col justify-between gap-10">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a6cff]">
                Portal do colaborador
              </p>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0e2a47] sm:text-[2.25rem]">
                Cuidando do pulso da sua empresa.
              </h1>
              <p className="mt-3 max-w-[32rem] text-sm leading-relaxed text-neutral-600">
                Celebrações, comunicados e holerites em um só lugar, com uma
                experiência pensada para o dia a dia dos times.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-full bg-[#8a6cff] px-7 py-2.5 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(138,108,255,0.35)] transition hover:bg-[#7a5cf5]"
                >
                  Entrar no QS Pulse
                </Link>
                <span className="text-xs text-neutral-500">
                  Multi-tenant · RBAC · RLS por organização
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4">
              <BrandLogo variant="full" className="flex justify-end" />
            </div>
          </div>
        </div>
      </FluidBackground>
    </main>
  );
}
