import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, User, X, LogOut, LayoutDashboard, Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useUI } from "@/lib/ui";
import { cn } from "@/lib/utils";

const LINKS = [
  { hash: "home", label: "Home" },
  { hash: "shop", label: "Shop" },
  { hash: "features", label: "Features" },
  { hash: "about", label: "About" },
  { hash: "contact", label: "Contact" },
] as const;

export function Navbar() {
  const { count } = useCart();
  const { user, profile, isAdmin, signOut } = useAuth();
  const ui = useUI();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const goShop = () => navigate({ to: "/", hash: "shop" });

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="glass-nav border-b border-foreground/5">
        <div className="mx-auto flex h-12 max-w-[1080px] items-center justify-between px-4 sm:px-6">
          <Link to="/" hash="home" className="text-foreground" aria-label="PreaseStudios beranda">
            <Logo />
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <li key={l.hash}>
                <Link
                  to="/"
                  hash={l.hash}
                  className="text-xs text-foreground/80 transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Cari produk"
              onClick={() => setSearchOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
            <button
              type="button"
              aria-label="Keranjang belanja"
              onClick={() => ui.setCartOpen(true)}
              className="relative grid h-9 w-9 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ShoppingBag className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Akun saya"
                    className="grid h-9 w-9 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <User className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-semibold">{profile?.full_name || "Pelanggan"}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-xl">
                    <Link to="/akun">
                      <Package className="h-4 w-4" /> Akun Saya
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link to="/admin">
                        <LayoutDashboard className="h-4 w-4" /> Dashboard Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="rounded-xl" onSelect={() => void signOut()}>
                    <LogOut className="h-4 w-4" /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                type="button"
                aria-label="Masuk"
                onClick={() => ui.openAuth("login")}
                className="grid h-9 w-9 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              >
                <User className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              aria-label="Menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-full text-foreground/80 hover:bg-secondary md:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-foreground/5">
            <form
              className="mx-auto flex max-w-[680px] items-center gap-3 px-4 py-3 sm:px-6"
              onSubmit={(e) => {
                e.preventDefault();
                setSearchOpen(false);
                goShop();
              }}
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={ui.search}
                onChange={(e) => ui.setSearch(e.target.value)}
                placeholder="Cari koleksi PreaseStudios"
                className="h-9 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
            </form>
          </div>
        )}

        <div
          className={cn(
            "overflow-hidden border-foreground/5 bg-background transition-[max-height] duration-500 ease-apple md:hidden",
            mobileOpen ? "max-h-96 border-t" : "max-h-0",
          )}
        >
          <ul className="flex flex-col px-6 py-3">
            {LINKS.map((l) => (
              <li key={l.hash}>
                <Link
                  to="/"
                  hash={l.hash}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-2xl font-semibold tracking-tight text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
