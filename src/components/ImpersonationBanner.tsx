"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function ImpersonationBanner() {
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setUserName(getCookie("impersonate_user_name"));
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
      className="w-full flex items-center justify-between px-5 shrink-0"
      style={{ height: 32, backgroundColor: "#FEF3C7", borderBottom: "1px solid #FDE68A" }}
    >
      <span className="text-xs font-semibold truncate" style={{ color: "#92400E" }}>
        Visualizando como <strong>{userName}</strong>
      </span>
      <button
        onClick={handleExit}
        className="flex-shrink-0 text-xs font-bold ml-4 underline underline-offset-2 transition-opacity hover:opacity-70"
        style={{ color: "#92400E" }}
      >
        Voltar ao meu acesso
      </button>
    </div>
  );
}
