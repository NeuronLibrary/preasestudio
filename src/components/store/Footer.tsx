import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/queries";
import { waLink } from "@/lib/format";
import { Logo } from "./Logo";

function handleUrl(platform: "instagram" | "tiktok" | "twitter", handle: string) {
  const h = handle.replace(/^@/, "");
  if (platform === "instagram") return `https://instagram.com/${h}`;
  if (platform === "tiktok") return `https://tiktok.com/@${h}`;
  return `https://x.com/${h}`;
}

export function Footer() {
  const { data: s } = useQuery(settingsQuery);
  const socials = s
    ? ([
        ["Instagram", "instagram", s.instagram],
        ["TikTok", "tiktok", s.tiktok],
        ["X / Twitter", "twitter", s.twitter],
      ] as const).filter(([, , v]) => !!v)
    : [];

  return (
    <footer className="border-t border-border bg-secondary text-xs text-muted-foreground">
      <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo className="text-foreground" />
            <p className="mt-3 max-w-xs leading-relaxed">{s?.tagline ? `${s.tagline}.` : ""} Fashion vintage terkurasi dari Bandung.</p>
          </div>
          <div>
            <p className="mb-3 font-semibold text-foreground">Jelajahi</p>
            <ul className="space-y-2">
              {(["home", "shop", "features", "about", "contact"] as const).map((h) => (
                <li key={h}>
                  <Link to="/" hash={h} className="capitalize hover:text-foreground">
                    {h}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 font-semibold text-foreground">Bantuan</p>
            <ul className="space-y-2">
              <li>
                <Link to="/akun" className="hover:text-foreground">Akun & Pesanan</Link>
              </li>
              {s?.whatsapp_number && (
                <li>
                  <a href={waLink(s.whatsapp_number, "Halo, saya butuh bantuan.")} target="_blank" rel="noreferrer" className="hover:text-foreground">
                    WhatsApp
                  </a>
                </li>
              )}
              {s?.email && (
                <li>
                  <a href={`mailto:${s.email}`} className="hover:text-foreground">{s.email}</a>
                </li>
              )}
            </ul>
          </div>
          <div>
            <p className="mb-3 font-semibold text-foreground">Ikuti Kami</p>
            <ul className="space-y-2">
              {socials.map(([label, key, v]) => (
                <li key={key}>
                  <a href={handleUrl(key, v!)} target="_blank" rel="noreferrer" className="hover:text-foreground">
                    {label} · {v}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {s?.store_name ?? "PreaseStudios"}. Hak cipta dilindungi.</p>
          {s?.address && <p>{s.address}</p>}
        </div>
      </div>
    </footer>
  );
}
