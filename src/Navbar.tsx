import React from "react";
import { Link, useLocation } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Wallet", href: "/wallet" },
  { label: "Recommendations", href: "/recommendations" },
  { label: "About", href: "/about" },
];

const LINK_SPACING = 24; // px entre cada item

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="fixed left-0 right-0 top-0 z-[100] h-16 w-full border-b border-gray-200 bg-gray-100">
      <div className="container mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight text-gray-900 no-underline transition-opacity hover:opacity-90"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <TrendingUp className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg">Finance</span>
        </Link>

        {/* Navigation: espaçamento via margin-right inline para garantir que aplique */}
        <nav aria-label="Menu principal" className="min-w-0">
          <ul className="flex list-none items-center rounded-lg bg-white/80 px-3 py-2 pr-4 shadow-sm">
            {navLinks.map(({ label, href }, index) => (
              <li key={href}>
                <Link
                  to={href}
                  style={
                    index < navLinks.length - 1
                      ? { marginRight: `${LINK_SPACING}px` }
                      : undefined
                  }
                  className={cn(
                    "relative flex h-10 items-center rounded-md px-4 text-sm font-medium text-gray-600",
                    "transition-colors duration-200",
                    "hover:bg-gray-100 hover:text-gray-900",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2",
                    location.pathname === href && "bg-gray-100 text-gray-900"
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
