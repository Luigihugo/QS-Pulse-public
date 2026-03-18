"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Profile } from "@/types/database";
import { BrandLogo } from "@/components/branding/BrandLogo";

interface HeaderProps {
  profile: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
}

export function Header({ profile }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    function onClose() {
      setOpen(false);
    }
    if (open) {
      window.addEventListener("click", onClose);
      return () => window.removeEventListener("click", onClose);
    }
  }, [open]);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-neutral-200/70 bg-white/80 px-4 backdrop-blur">
      <Link href="/app/feed" className="flex items-center gap-2">
        <BrandLogo variant="icon" />
      </Link>
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-neutral-100"
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-300 text-sm font-medium text-neutral-700">
              {initials}
            </span>
          )}
          <span className="max-w-[120px] truncate text-sm text-neutral-700">
            {profile?.full_name ?? "Perfil"}
          </span>
        </button>
        {open && (
          <div
            className="absolute right-0 top-full z-10 mt-2 w-48 rounded-xl border border-neutral-200 bg-white py-1 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href="/app/settings/profile"
              className="block px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50"
              onClick={() => setOpen(false)}
            >
              Perfil
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-neutral-700 transition hover:bg-neutral-50"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
