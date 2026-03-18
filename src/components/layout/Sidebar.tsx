"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { OrgRole } from "@/types/database";

const collaboratorNav = [
  { href: "/app/feed", label: "Feed", icon: FeedIcon },
  { href: "/app/payslips", label: "Holerites", icon: PayslipIcon },
  { href: "/app/feedback", label: "Feedback", icon: FeedbackIcon },
  { href: "/app/org-chart", label: "Org Chart", icon: OrgChartIcon },
];

const adminNav = { href: "/app/admin/users", label: "Usuários", icon: UsersIcon };
const settingsNav = {
  href: "/app/settings/profile",
  label: "Configurações",
  icon: SettingsIcon,
};

function canAccessAdmin(role: OrgRole) {
  return role === "owner" || role === "admin";
}

function FeedIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  );
}

function PayslipIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.25a3.75 3.75 0 00-3.75-3.75h-1.5A1.5 1.5 0 0113 8.25v-1.5a3.75 3.75 0 00-3.75-3.75H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function FeedbackIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </svg>
  );
}

function OrgChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.281z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  isPlaceholder,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isPlaceholder?: boolean;
}) {
  const baseClasses =
    "group/link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out min-h-[44px]";

  const activeClasses =
    "bg-[#27FFC8]/15 text-[#27FFC8] shadow-[0_0_20px_rgba(39,255,200,0.15)]";
  const inactiveClasses =
    "text-neutral-300 hover:bg-white/5 hover:text-white hover:shadow-[0_0_12px_rgba(167,139,250,0.08)]";

  const iconClasses = `h-5 w-5 shrink-0 transition-transform duration-200 group-hover/link:scale-110 ${
    isActive ? "text-[#27FFC8]" : "text-neutral-400"
  }`;

  const labelSpan = (
    <span className="overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 max-w-0 opacity-0 group-hover/sidebar:max-w-[10rem] group-hover/sidebar:opacity-100">
      {label}
    </span>
  );

  const badgeSpan = isPlaceholder && (
    <span className="ml-auto overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 max-w-0 opacity-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 group-hover/sidebar:max-w-[4rem] group-hover/sidebar:opacity-100">
      Em breve
    </span>
  );

  const content = (
    <>
      <Icon className={iconClasses} />
      {labelSpan}
      {badgeSpan}
    </>
  );

  if (isPlaceholder) {
    return (
      <span
        className={`${baseClasses} cursor-not-allowed text-neutral-500 ${inactiveClasses}`}
        title={`${label} (em breve)`}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {content}
    </Link>
  );
}

export function Sidebar({ role }: { role: OrgRole }) {
  const pathname = usePathname();
  const isAdmin = canAccessAdmin(role);

  return (
    <div
      className="group/sidebar w-[72px] hover:w-60 shrink-0 overflow-hidden rounded-r-2xl transition-[width] duration-200 ease-out"
      aria-label="Menu lateral"
    >
      <aside className="flex h-full min-h-screen flex-col border-r border-white/5 bg-[#0d0a14] p-4 shadow-[0_0_40px_rgba(82,39,255,0.06)]">
        <nav className="flex flex-1 flex-col gap-0.5">
          {/* Bloco colaborador */}
          {collaboratorNav.map(({ href, label, icon }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              isActive={pathname === href || pathname.startsWith(href + "/")}
            />
          ))}

          {/* Separador */}
          <div
            className="my-3 h-px w-full shrink-0 bg-gradient-to-r from-transparent via-[#5227FF]/40 to-transparent transition-opacity duration-200 group-hover/sidebar:opacity-100 opacity-60"
            aria-hidden
          />

          {/* Bloco admin */}
          {isAdmin && (
            <NavLink
              href={adminNav.href}
              label={adminNav.label}
              icon={adminNav.icon}
              isActive={
                pathname === adminNav.href ||
                pathname.startsWith(adminNav.href + "/")
              }
            />
          )}

          <NavLink
            href={settingsNav.href}
            label={settingsNav.label}
            icon={settingsNav.icon}
            isActive={
              pathname === settingsNav.href ||
              pathname.startsWith(settingsNav.href + "/")
            }
          />
        </nav>

        {/* Detalhe visual inferior (fluido) */}
        <div
          className="mt-4 h-1 w-full shrink-0 rounded-full bg-gradient-to-r from-[#5227FF]/30 via-[#FF9FFC]/20 to-[#B19EEF]/30 opacity-60 animate-pulse"
          style={{ animationDuration: "3s" }}
          aria-hidden
        />
      </aside>
    </div>
  );
}
