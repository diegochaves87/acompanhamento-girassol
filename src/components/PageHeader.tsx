import Link from "next/link";
import React from "react";

function PetalDeco() {
  return (
    <svg
      className="absolute opacity-25 pointer-events-none"
      style={{ top: -6, right: -6 }}
      width="52" height="52" viewBox="0 0 52 52" fill="none"
      aria-hidden="true"
    >
      <ellipse cx="26" cy="13" rx="8" ry="13" fill="#FFC107" transform="rotate(0 26 26)" />
      <ellipse cx="26" cy="13" rx="8" ry="13" fill="#FFBA3D" transform="rotate(72 26 26)" />
      <ellipse cx="26" cy="13" rx="8" ry="13" fill="#FFC107" transform="rotate(144 26 26)" />
      <ellipse cx="26" cy="13" rx="8" ry="13" fill="#FFBA3D" transform="rotate(216 26 26)" />
      <ellipse cx="26" cy="13" rx="8" ry="13" fill="#FFC107" transform="rotate(288 26 26)" />
    </svg>
  );
}

interface PageHeaderProps {
  title: string;
  backHref?: string;
  backLabel?: string;
  iconColor?: string;
  iconBg?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: string;
  subtitle?: string;
}

export default function PageHeader({
  title,
  backHref = "/terapeuta",
  backLabel = "Início",
  iconColor = "#1D3557",
  iconBg,
  icon,
  actions,
  maxWidth = "max-w-5xl",
  subtitle,
}: PageHeaderProps) {
  const bg = iconBg ?? iconColor + "18";

  return (
    <header
      style={{ backgroundColor: "#fff", borderBottom: "1px solid #E5E7EB" }}
      className="px-6 py-4"
    >
      <div className={`${maxWidth} mx-auto flex items-center justify-between gap-4`}>
        {/* Left: back + icon + title */}
        <div className="flex items-center gap-4 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="flex-shrink-0 flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-60"
              style={{ color: "#6B7280" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {backLabel}
            </Link>
          )}

          {icon && (
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: bg, color: iconColor }}
            >
              {icon}
            </div>
          )}

          <div className="min-w-0">
            <h1
              className="font-bold text-lg leading-tight truncate"
              style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-gray-400 leading-tight mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: actions + petal */}
        <div className="relative flex items-center gap-3 flex-shrink-0">
          {actions}
          <PetalDeco />
        </div>
      </div>
    </header>
  );
}
