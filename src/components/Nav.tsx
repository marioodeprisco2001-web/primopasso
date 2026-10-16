"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon, HeartIcon, ReviewIcon, SearchIcon } from "./icons";

const ITEMS = [
  { href: "/", label: "Cerca", icon: <SearchIcon size={22} />, badge: "" as const },
  { href: "/preferiti", label: "Preferiti", icon: <HeartIcon size={22} />, badge: "fav" as const },
  { href: "/avvisi", label: "Avvisi", icon: <BellIcon size={22} />, badge: "alert" as const },
];

type Counts = { fav: number; alert: number };

const isActive = (path: string, href: string) => (href === "/" ? path === "/" || path.startsWith("/lavoro") : path.startsWith(href));

export function MainNav({ counts, admin }: { counts: Counts; admin: boolean }) {
  const path = usePathname();
  return (
    <nav className="main" aria-label="Sezioni">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} className="navbtn" aria-current={isActive(path, i.href) ? "page" : undefined}>
          {i.label}
          {i.badge && counts[i.badge] > 0 && <span className="badge">{counts[i.badge]}</span>}
        </Link>
      ))}
      {admin && <Link href="/admin" className="navbtn" aria-current={path.startsWith("/admin") ? "page" : undefined}>Admin</Link>}
    </nav>
  );
}

export function TabBar({ counts, admin }: { counts: Counts; admin: boolean }) {
  const path = usePathname();
  const items = admin ? [...ITEMS, { href: "/admin", label: "Admin", icon: <ReviewIcon />, badge: "" as const }] : [...ITEMS, { href: "/account", label: "Profilo", icon: <span aria-hidden style={{ fontSize: 18, lineHeight: "22px" }}>●</span>, badge: "" as const }];
  return (
    <nav className="tabbar" aria-label="Sezioni">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={isActive(path, i.href) ? "page" : undefined}>
          {i.icon}
          {i.label}
          {i.badge && counts[i.badge] > 0 && <span className="badge">{counts[i.badge]}</span>}
        </Link>
      ))}
    </nav>
  );
}
