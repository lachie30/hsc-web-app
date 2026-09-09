// src/components/NavBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/upload", label: "Upload" },
  { href: "/browse", label: "Browse & Practice" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="bg-[#1a3c6e] text-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          HSC Question Bank
        </Link>
        <nav className="flex gap-6">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border-b-2 pb-1 text-sm transition-opacity ${
                  isActive
                    ? "border-white opacity-100"
                    : "border-transparent opacity-90 hover:opacity-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
