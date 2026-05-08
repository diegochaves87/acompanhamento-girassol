"use client";

import { useRouter } from "next/navigation";

export default function ImpersonateButton({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();

  function handleClick() {
    document.cookie = `impersonate_user_id=${userId}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `impersonate_user_name=${encodeURIComponent(userName)}; path=/; max-age=86400; SameSite=Lax`;
    localStorage.setItem("impersonate_user_id", userId);
    localStorage.setItem("impersonate_user_name", userName);
    router.push("/terapeuta");
  }

  return (
    <button
      onClick={handleClick}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 whitespace-nowrap"
      style={{ backgroundColor: "#1D3557", color: "#ffffff" }}
    >
      Acessar como {userName.split(" ")[0]}
    </button>
  );
}
