import {
  Activity,
  Apple,
  BookOpenCheck,
  Bot,
  Dumbbell,
  Gauge,
  LogOut,
  Smartphone,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { PairMobileDialog } from "./PairMobileDialog";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/", icon: Gauge, label: "Dashboard" },
  { href: "/workouts", icon: Dumbbell, label: "Workouts" },
  { href: "/nutrition", icon: Apple, label: "Nutrition" },
  { href: "/presets", icon: BookOpenCheck, label: "Presets" },
  { href: "/profile", icon: UserRound, label: "Profile" },
  { href: "/ai", icon: Bot, label: "AI" },
];

export function AppLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isPairDialogOpen, setIsPairDialogOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-overload-background text-overload-ink lg:flex">
      <aside className="border-b border-white/10 bg-overload-primary text-overload-onPrimary lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r">
        <div className="px-5 py-4 lg:px-6 lg:py-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-overload-primary-muted">
              Overload
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal">Training Desk</h1>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-1 lg:px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                [
                  "inline-flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-overload-surface text-overload-primary shadow-sm"
                    : "text-white/72 hover:bg-white/10 hover:text-white",
                ].join(" ")
              }
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto hidden px-6 pb-6 pt-8 lg:block">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-overload-primary text-sm font-bold text-overload-onPrimary">
                {user?.firstName?.slice(0, 1)}
                {user?.lastName?.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="truncate text-xs text-white/58">{user?.email}</p>
              </div>
            </div>
            <button
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              type="button"
              onClick={() => setIsPairDialogOpen(true)}
            >
              <Smartphone className="h-4 w-4" aria-hidden="true" />
              Sync mobile
            </button>
            <button
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              type="button"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-overload-border/80 bg-overload-background/90 px-5 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden h-9 w-9 items-center justify-center rounded-lg bg-overload-primary text-overload-onPrimary lg:flex">
                <Activity className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="truncate text-xs text-overload-muted">{user?.goal}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-overload-border-strong bg-overload-elevated px-3 text-sm font-semibold text-overload-ink shadow-sm transition hover:border-overload-primary"
                type="button"
                onClick={() => navigate("/ai")}
              >
                <Bot className="h-4 w-4" aria-hidden="true" />
                AI
              </button>
              <button
                className="hidden h-10 items-center justify-center gap-2 rounded-lg border border-overload-border-strong bg-overload-elevated px-3 text-sm font-semibold text-overload-ink shadow-sm transition hover:border-overload-primary sm:inline-flex"
                type="button"
                onClick={() => setIsPairDialogOpen(true)}
              >
                <Smartphone className="h-4 w-4" aria-hidden="true" />
                Sync mobile
              </button>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-overload-border-strong bg-overload-elevated px-3 text-sm font-semibold text-overload-ink shadow-sm transition hover:border-overload-primary"
                type="button"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
      <PairMobileDialog
        isOpen={isPairDialogOpen}
        onClose={() => setIsPairDialogOpen(false)}
      />
    </div>
  );
}
