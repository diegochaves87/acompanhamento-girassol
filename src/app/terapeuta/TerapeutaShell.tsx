"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import WelcomePopup from "@/components/WelcomePopup";

type NavItem = { label: string; href: string; exact?: boolean; icon: React.ReactElement };

type Profissional = {
  full_name: string | null;
  profession: string | null;
  specialty: string | null;
};

type Props = {
  children: React.ReactNode;
  profissional: Profissional | null;
};

const NAV_TOP: NavItem[] = [
  {
    label: "Página Inicial",
    href: "/terapeuta",
    exact: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Pacientes",
    href: "/terapeuta/pacientes",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m8-4a4 4 0 11-8 0 4 4 0 018 0zM3 8a4 4 0 118 0 4 4 0 01-8 0z" />
      </svg>
    ),
  },
  {
    label: "Agenda",
    href: "/terapeuta/agenda",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Financeiro",
    href: "/terapeuta/financeiro",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Evoluções",
    href: "/terapeuta/evolucoes",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Clínicas",
    href: "/terapeuta/clinicas",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

const NAV_BOTTOM: NavItem[] = [
  {
    label: "Quem Somos",
    href: "/terapeuta/sobre",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: "Configurações",
    href: "/terapeuta/configuracoes",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const OPEN_W = 240;
const CLOSED_W = 60;

export default function TerapeutaShell({ children, profissional }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_open");
    setSidebarOpen(saved !== "false");
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    setMounted(true);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  function toggleSidebar() {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    localStorage.setItem("sidebar_open", String(next));
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const sidebarW = sidebarOpen ? OPEN_W : CLOSED_W;
  const contentMargin = mounted && isDesktop ? sidebarW : 0;
  const initial = profissional?.full_name?.trim()[0]?.toUpperCase() ?? "U";

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        {NAV_TOP.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={!sidebarOpen && !onNavigate ? item.label : undefined}
              className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${active ? "text-white bg-white/15" : "text-white/65 hover:text-white hover:bg-white/10"}
                ${!sidebarOpen && !onNavigate ? "justify-center" : ""}`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {(sidebarOpen || onNavigate) && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </>
    );
  }

  function NavBottomLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        {NAV_BOTTOM.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={!sidebarOpen && !onNavigate ? item.label : undefined}
              className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${active ? "text-white bg-white/15" : "text-white/65 hover:text-white hover:bg-white/10"}
                ${!sidebarOpen && !onNavigate ? "justify-center" : ""}`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {(sidebarOpen || onNavigate) && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <>
      <WelcomePopup saibaMaisHref="/terapeuta/sobre" />

      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex fixed top-0 left-0 h-full z-40 flex-col transition-all duration-300 overflow-hidden"
        style={{ width: sidebarW, backgroundColor: "#1a4a3a" }}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-white/10 flex-shrink-0">
          {sidebarOpen && (
            <span className="text-white font-bold text-sm tracking-tight whitespace-nowrap overflow-hidden pl-1">
              Jornada Terapêutica
            </span>
          )}
          <button
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            className={`flex-shrink-0 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors ${!sidebarOpen ? "mx-auto" : ""}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {sidebarOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              }
            </svg>
          </button>
        </div>

        {/* Nav top */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          <NavLinks />
        </nav>

        {/* Nav bottom */}
        <div className="border-t border-white/10 py-2 overflow-x-hidden">
          <NavBottomLinks />
        </div>

        {/* Logout */}
        <div className="px-2 py-3 border-t border-white/10 overflow-x-hidden">
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Sair" : undefined}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/65 hover:text-white hover:bg-white/10 transition-colors ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <span className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile FAB ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-5 left-5 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#1a4a3a", color: "white" }}
        aria-label="Abrir menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-72 z-50 flex flex-col shadow-2xl transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: "#1a4a3a" }}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <span className="text-white font-bold text-base">Jornada Terapêutica</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          <NavLinks onNavigate={() => setMobileOpen(false)} />
        </nav>
        <div className="border-t border-white/10 py-2">
          <NavBottomLinks onNavigate={() => setMobileOpen(false)} />
        </div>
        <div className="px-3 py-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-white/65 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </div>

      {/* ── Profile badge — top-right, desktop only ── */}
      <div className="hidden md:flex fixed top-3 right-4 z-30 items-center gap-2.5 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow select-none">
        <div className="text-right leading-none">
          {profissional?.profession && (
            <p className="text-[10px] font-semibold mb-0.5" style={{ color: "#1a4a3a" }}>
              {profissional.profession}
            </p>
          )}
          {profissional?.specialty && (
            <p className="text-[9px] text-gray-400 mb-1">{profissional.specialty}</p>
          )}
          <p className="text-xs font-bold text-gray-800">{profissional?.full_name ?? "—"}</p>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: "#1a4a3a" }}
        >
          {initial}
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* ── Content offset wrapper ── */}
      <div
        className="transition-all duration-300"
        style={{ marginLeft: contentMargin }}
      >
        {children}
      </div>
    </>
  );
}
