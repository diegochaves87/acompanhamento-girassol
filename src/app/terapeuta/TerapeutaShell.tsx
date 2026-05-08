"use client";

import React, { useState, useEffect, useRef } from "react";
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
  email: string | null;
  userId: string | null;
};

type Props = {
  children: React.ReactNode;
  profissional: Profissional | null;
};

const NAV_TOP: NavItem[] = [
  {
    label: "Início",
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
const CLOSED_W = 64;
const HEADER_H = 72;

export default function TerapeutaShell({ children, profissional }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);

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
  const profLabel = [profissional?.profession, profissional?.specialty]
    .filter(Boolean)
    .join(" / ")
    .toUpperCase() || "TERAPEUTA";

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
              className={`flex items-center mr-2 ml-0 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${collapsed ? "justify-center mx-2" : "gap-3"}`}
              style={{
                backgroundColor: active ? "#F0FFF4" : undefined,
                color: active ? "#4CAF50" : "#1D3557",
                borderLeft: active ? "3px solid #4CAF50" : "3px solid transparent",
                borderRadius: "0 12px 12px 0",
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
        {/* Logo / toggle block */}
        <div className="flex-shrink-0 border-b" style={{ borderColor: "#E5E7EB" }}>
          {sidebarOpen ? (
            <div className="relative p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/identidade-visual/logo-vetorizada.svg"
                alt="Acompanhamento Girassol"
                style={{ width: "100%", height: "auto", maxHeight: 80, objectFit: "contain", objectPosition: "left" }}
              />
              <button
                onClick={toggleSidebar}
                aria-label="Fechar menu"
                className="absolute top-2 right-2 p-1.5 rounded-lg transition-colors hover:bg-gray-100"
                style={{ color: "#9CA3AF" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={toggleSidebar}
              aria-label="Abrir menu"
              className="w-full flex justify-center hover:bg-gray-50 transition-colors"
              style={{ padding: "12px 0" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/identidade-visual/icone-logo-vetorizado.svg"
                alt="Girassol"
                style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
              />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
          <SidebarLinks items={NAV_TOP} />
        </nav>

        {/* People illustration */}
        {sidebarOpen && (
          <div className="flex justify-center px-4 pt-1 pb-0">
            <svg width="120" height="42" viewBox="0 0 120 42" fill="none">
              <circle cx="24" cy="10" r="7" fill="#4CAF50"/>
              <path d="M13 40c0-6.075 4.925-11 11-11s11 4.925 11 11H13z" fill="#4CAF50"/>
              <circle cx="60" cy="8" r="8" fill="#2E7BC1"/>
              <path d="M48 40c0-6.627 5.373-12 12-12s12 5.373 12 12H48z" fill="#2E7BC1"/>
              <circle cx="96" cy="10" r="7" fill="#FFC107"/>
              <path d="M85 40c0-6.075 4.925-11 11-11s11 4.925 11 11H85z" fill="#FFC107"/>
            </svg>
          </div>
        )}

        {/* Precisa de ajuda card */}
        {sidebarOpen && (
          <div className="px-3 pb-2 pt-1">
            <Link
              href="/terapeuta/sobre"
              className="flex items-center gap-2.5 p-3 rounded-xl transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#F3F0FF" }}
            >
              <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#E9E4F8", color: "#8E6CCF" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-tight" style={{ color: "#8E6CCF" }}>Precisa de ajuda?</p>
                <p className="text-[10px] leading-tight" style={{ color: "#8E6CCF", opacity: 0.75 }}>Fale com nossa equipe</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "#8E6CCF" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* Bottom nav links */}
        <div className="border-t py-1 overflow-x-hidden" style={{ borderColor: "#E5E7EB" }}>
          <SidebarLinks items={NAV_BOTTOM} />
        </div>

        {/* Logout */}
        <div className="px-0 py-2 border-t overflow-x-hidden" style={{ borderColor: "#E5E7EB" }}>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Sair" : undefined}
            className={`flex items-center mr-2 ml-0 px-3 py-2.5 w-full text-sm font-medium transition-colors hover:bg-gray-50 ${!sidebarOpen ? "justify-center mx-2" : "gap-3"}`}
            style={{ color: "#9CA3AF", borderLeft: "3px solid transparent", borderRadius: "0 12px 12px 0" }}
          >
            <span className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* ── Desktop top header bar ── */}
      <header
        className="hidden md:grid grid-cols-3 fixed top-0 z-30 items-center px-5 border-b"
        style={{
          backgroundColor: "white",
          borderColor: "#E5E7EB",
          left: sidebarW,
          right: 0,
          height: HEADER_H,
          transition: "left 0.3s",
        }}
      >
        {/* Left: empty (sidebar is outside the header) */}
        <div />

        {/* Center: brand logo */}
        <div className="flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/identidade-visual/mao.svg"
            alt="mão e Girassol"
            style={{ height: 64, width: 200, objectFit: "contain" }}
          />
        </div>

        {/* Right: Profile dropdown */}
        <div className="flex items-center justify-end" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-50"
          >
            <div className="text-right">
              <p
                className="text-[11px] font-bold leading-tight tracking-wide"
                style={{ color: "#4CAF50", fontFamily: "var(--font-poppins, sans-serif)" }}
              >
                {profLabel}
              </p>
              <p className="text-xs font-medium leading-tight" style={{ color: "#1D3557" }}>
                {profissional?.full_name ?? "—"}
              </p>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 border-2 border-white shadow-sm"
              style={{ backgroundColor: "#4CAF50" }}
            >
              {initial}
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-4 h-4 flex-shrink-0 transition-transform ${profileOpen ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              style={{ color: "#9CA3AF" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div
              className="absolute top-full right-5 mt-1 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
              style={{ top: HEADER_H }}
            >
              {/* Header */}
              <div className="px-5 py-4" style={{ backgroundColor: "#f0f4f1" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                    style={{ backgroundColor: "#4CAF50", color: "white" }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{profissional?.full_name ?? "—"}</p>
                    <p className="text-xs text-gray-500 truncate">{profissional?.email ?? ""}</p>
                    {profissional?.specialty && (
                      <p className="text-xs font-medium truncate" style={{ color: "#4CAF50" }}>{profissional.specialty}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="py-1">
                <Link
                  href="/terapeuta/configuracoes"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Meu perfil
                </Link>
                <Link
                  href="/terapeuta/configuracoes"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Configurações
                </Link>
              </div>

              <div className="border-t" style={{ borderColor: "#E5E7EB" }}>
                <button
                  onClick={() => { setProfileOpen(false); handleLogout(); }}
                  className="flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

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

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/identidade-visual/mao.svg"
          alt="Acompanhamento Girassol"
          style={{ height: 36, width: "auto", objectFit: "contain" }}
        />

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
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: "#E5E7EB" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/identidade-visual/logo-vetorizada.svg"
            alt="Acompanhamento Girassol"
            style={{ height: 44, width: "auto", objectFit: "contain" }}
          />
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

        <nav className="flex-1 py-2 overflow-y-auto">
          <SidebarLinks items={NAV_TOP} onNavigate={() => setMobileDrawerOpen(false)} />
        </nav>

        <div className="border-t py-1" style={{ borderColor: "#E5E7EB" }}>
          <SidebarLinks items={NAV_BOTTOM} onNavigate={() => setMobileDrawerOpen(false)} />
        </div>

        <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: "#E5E7EB" }}>
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
                {item.label}
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

      {/* ── Content wrapper ── */}
      <div
        className="transition-all duration-300 pb-16 md:pb-0"
        style={{ marginLeft: contentMargin, backgroundColor: "#F9FAFB", minHeight: "100vh", paddingTop: HEADER_H }}
      >
        {children}
      </div>
    </>
  );
}
