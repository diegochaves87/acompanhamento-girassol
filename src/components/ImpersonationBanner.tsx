"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function ImpersonationBanner() {
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const name = getCookie("impersonate_user_name");
    setUserName(name);
  }, []);

  function handleExit() {
    document.cookie = "impersonate_user_id=; path=/; max-age=0";
    document.cookie = "impersonate_user_name=; path=/; max-age=0";
    localStorage.removeItem("impersonate_user_id");
    localStorage.removeItem("impersonate_user_name");
    setUserName(null);
    router.push("/admin");
  }

  if (!userName) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-5 py-2"
      style={{ backgroundColor: "#FFBA3D", color: "#1D3557" }}
    >
      <span className="text-sm font-semibold">
        Você está visualizando como <strong>{userName}</strong> — modo admin
      </span>
      <button
        onClick={handleExit}
        className="text-xs font-bold px-3 py-1 rounded-lg transition-opacity hover:opacity-75"
        style={{ backgroundColor: "#1D3557", color: "#ffffff" }}
      >
        Sair do modo admin
      </button>
    </div>
  );
}
