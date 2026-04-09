"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/guru", label: "Guru" },
  { href: "/jam-pelajaran", label: "Jam" },
  { href: "/hari-belajar", label: "Hari" },
  { href: "/kelas", label: "Kelas" },
  { href: "/penugasan", label: "Penugasan" },
  { href: "/penugasan-v2", label: "Penugasan V2" },
  { href: "/jadwal", label: "Jadwal" },
  { href: "/jadwal-v2", label: "Jadwal V2" },
  { href: "/jadwal-v3", label: "Jadwal V3" },
  { href: "/print/kelas", label: "Print Kelas" },
  { href: "/print/guru", label: "Print Guru" },
  { href: "/settings", label: "Settings" },
];

export function TopNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav className="top-nav">
      {links.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={active ? "active" : ""}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
