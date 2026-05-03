"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import WelcomePopup from "@/components/WelcomePopup";

type NavItem = {
  label: string;
  href: string;
  exact?: boolean;
  icon: React.ReactElement;
  color: string;
  bgColor: string;
};

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
    color: "#1D3557",
    bgColor: "#EEF2FF",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Pacientes",
    href: "/terapeuta/pacientes",
    color: "#4CAF50",
    bgColor: "#F0FFF4",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m8-4a4 4 0 11-8 0 4 4 0 018 0zM3 8a4 4 0 118 0 4 4 0 01-8 0z" />
      </svg>
    ),
  },
  {
    label: "Agenda",
    href: "/terapeuta/agenda",
    color: "#2E7BC1",
    bgColor: "#EFF6FF",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Financeiro",
    href: "/terapeuta/financeiro",
    color: "#FFBA3D",
    bgColor: "#FFFBEB",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Evoluções",
    href: "/terapeuta/evolucoes",
    color: "#8E6CCF",
    bgColor: "#F3F0FF",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Clínicas",
    href: "/terapeuta/clinicas",
    color: "#FF5C7A",
    bgColor: "#FFF0F3",
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
    color: "#6B7280",
    bgColor: "#F3F4F6",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: "Configurações",
    href: "/terapeuta/configuracoes",
    color: "#6B7280",
    bgColor: "#F3F4F6",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const NAV_MOBILE_BOTTOM = NAV_TOP.slice(0, 4);

const OPEN_W = 280;
const CLOSED_W = 60;

export default function TerapeutaShell({ children, profissional }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
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

  useEffect(() => { setMobileDrawerOpen(false); }, [pathname]);

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

  function SidebarLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
    return (
      <>
        {items.map((item) => {
          const active = isActive(item.href, item.exact);
          const collapsed = !sidebarOpen && !onNavigate;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={`flex items-center mx-2 px-2 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50 ${collapsed ? "justify-center" : "gap-3"}`}
              style={{
                backgroundColor: active ? "#F0FFF4" : undefined,
                color: active ? "#4CAF50" : "#1D3557",
              }}
            >
              <span
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: item.bgColor, color: item.color }}
              >
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
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
        className="hidden md:flex fixed top-0 left-0 h-full z-40 flex-col transition-all duration-300 overflow-hidden border-r"
        style={{ width: sidebarW, backgroundColor: "white", borderColor: "#E5E7EB" }}
      >
        <div
          className="flex items-center justify-between px-3 py-4 border-b flex-shrink-0"
          style={{ borderColor: "#E5E7EB" }}
        >
          {sidebarOpen && (
            <span
              className="font-bold text-sm tracking-tight whitespace-nowrap overflow-hidden pl-1"
              style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
            >
              Acompanhamento Girassol
            </span>
          )}
          <button
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-gray-100 ${!sidebarOpen ? "mx-auto" : ""}`}
            style={{ color: "#1D3557" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {sidebarOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              }
            </svg>
          </button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          <SidebarLinks items={NAV_TOP} />
        </nav>

        <div className="border-t py-2 overflow-x-hidden" style={{ borderColor: "#E5E7EB" }}>
          <SidebarLinks items={NAV_BOTTOM} />
        </div>

        <div className="px-2 py-3 border-t overflow-x-hidden" style={{ borderColor: "#E5E7EB" }}>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Sair" : undefined}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50 ${!sidebarOpen ? "justify-center" : ""}`}
            style={{ color: "#6B7280" }}
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

      {/* ── Mobile top header ── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 border-b"
        style={{ backgroundColor: "white", borderColor: "#E5E7EB" }}
      >
        <button
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Abrir menu"
          className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
          style={{ color: "#1D3557" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <span
          className="font-bold text-sm"
          style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
        >
          Acompanhamento Girassol
        </span>

        <button
          aria-label="Notificações"
          className="p-1.5 rounded-lg transition-colors hover:bg-blue-50"
          style={{ color: "#2E7BC1" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      </header>

      {/* ── Mobile backdrop ── */}
      {mobileDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-72 z-50 flex flex-col shadow-2xl transition-transform duration-300 border-r ${mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: "white", borderColor: "#E5E7EB" }}
      >
        <div
          className="flex items-center justify-between px-5 py-5 border-b"
          style={{ borderColor: "#E5E7EB" }}
        >
          <span
            className="font-bold text-base"
            style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
          >
            Acompanhamento Girassol
          </span>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="hover:bg-gray-100 p-1 rounded-lg transition-colors"
            style={{ color: "#6B7280" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          <SidebarLinks items={NAV_TOP} onNavigate={() => setMobileDrawerOpen(false)} />
        </nav>

        <div className="border-t py-2" style={{ borderColor: "#E5E7EB" }}>
          <SidebarLinks items={NAV_BOTTOM} onNavigate={() => setMobileDrawerOpen(false)} />
        </div>

        <div className="px-3 py-3 border-t" style={{ borderColor: "#E5E7EB" }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ color: "#6B7280" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center border-t h-16"
        style={{ backgroundColor: "white", borderColor: "#E5E7EB" }}
      >
        {NAV_MOBILE_BOTTOM.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full px-1"
            >
              <span style={{ color: active ? "#4CAF50" : "#9CA3AF" }}>
                {item.icon}
              </span>
              <span
                className="text-[9px] font-medium leading-none truncate max-w-full text-center"
                style={{ color: active ? "#4CAF50" : "#9CA3AF" }}
              >
                {item.label === "Página Inicial" ? "Início" : item.label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full px-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: "#9CA3AF" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-[9px] font-medium leading-none" style={{ color: "#9CA3AF" }}>Mais</span>
        </button>
      </nav>

      {/* ── Profile badge — desktop only ── */}
      <div
        className="hidden md:flex fixed top-2 right-3 z-30 items-center gap-1.5 bg-white rounded-lg px-2 py-1 shadow-sm border cursor-pointer hover:shadow-md transition-shadow select-none max-h-[38px] overflow-hidden"
        style={{ borderColor: "#E5E7EB" }}
      >
        <div className="text-right leading-tight">
          {(profissional?.profession || profissional?.specialty) && (
            <p className="text-[9px] truncate max-w-[150px] leading-none mb-0.5" style={{ color: "#9CA3AF" }}>
              {[profissional?.profession, profissional?.specialty].filter(Boolean).join(" · ")}
            </p>
          )}
          <p className="text-[10px] font-bold truncate max-w-[150px] leading-none" style={{ color: "#1D3557" }}>
            {profissional?.full_name ?? "—"}
          </p>
        </div>
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
          style={{ backgroundColor: "#4CAF50" }}
        >
          {initial}
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "#9CA3AF" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* ── Content wrapper ── */}
      <div
        className="transition-all duration-300 pt-14 md:pt-0 pb-16 md:pb-0"
        style={{ marginLeft: contentMargin }}
      >
        {children}
      </div>
    </>
  );
}
