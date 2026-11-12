import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useUI } from "@/lib/ui";
import { myOrdersQuery } from "@/lib/queries";
import { formatDate, formatRupiah, friendlyError } from "@/lib/format";
import { EmptyState, ErrorState, LoadingState } from "@/components/store/StateViews";
import { StatusBadge } from "@/components/store/InvoiceDialog";

export const Route = createFileRoute("/akun")({
  head: () => ({
    meta: [
      { title: "Akun Saya — PreaseStudios" },
      { name: "description", content: "Kelola profil dan lihat riwayat pesanan PreaseStudios Anda." },
      { property: "og:title", content: "Akun Saya — PreaseStudios" },
      { property: "og:description", content: "Profil dan riwayat pesanan PreaseStudios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading, profile, signOut, isAdmin } = useAuth();
  const ui = useUI();

  if (loading) return <div className="pt-32"><LoadingState /></div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 pb-24 pt-36 text-center">
        <h1 className="text-4xl text-foreground">Akun Saya</h1>
        <p className="mt-3 text-muted-foreground">Masuk untuk melihat profil dan riwayat pesanan Anda.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" onClick={() => ui.openAuth("login")}>Masuk</Button>
          <Button size="lg" variant="outline" onClick={() => ui.openAuth("register")}>Daftar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1080px] px-5 pb-24 pt-28 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Halo,</p>
          <h1 className="text-headline text-foreground">{profile?.full_name || "Pelanggan"}</h1>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="secondary" asChild>
              <Link to="/admin">Dashboard Admin</Link>
            </Button>
          )}
          <Button variant="outline" onClick={() => void signOut()}>
            <LogOut /> Keluar
          </Button>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <ProfileCard />
        <OrdersCard />
      </div>
    </div>
  );
}

function ProfileCard() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (fullName.trim().length < 2) throw new Error("Nama minimal 2 karakter.");
      if (phone.trim() && !/^(\+?62|0)8\d{7,12}$/.test(phone.replace(/[\s-]/g, ""))) throw new Error("Nomor WhatsApp tidak valid.");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.replace(/[\s-]/g, "") || null })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profil disimpan");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  return (
    <form
      className="h-fit rounded-card bg-secondary p-6 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <h2 className="text-xl text-foreground">Profil</h2>
      <div className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="p-email">Email</Label>
          <Input id="p-email" value={user?.email ?? ""} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-name">Nama lengkap</Label>
          <Input id="p-name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-phone">Nomor WhatsApp</Label>
          <Input id="p-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081234567890" inputMode="tel" maxLength={16} />
        </div>
        <Button type="submit" className="w-full" disabled={save.isPending}>
          {save.isPending && <Loader2 className="animate-spin" />} Simpan Profil
        </Button>
      </div>
    </form>
  );
}

function OrdersCard() {
  const { user } = useAuth();
  const ui = useUI();
  const orders = useQuery(myOrdersQuery(user?.id));
  return (
    <section className="rounded-card border border-border p-6 sm:p-8 lg:col-span-2">
      <h2 className="text-xl text-foreground">Riwayat Pesanan</h2>
      <div className="mt-5">
        {orders.isPending ? (
          <LoadingState label="Memuat pesanan…" />
        ) : orders.isError ? (
          <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
        ) : orders.data.length === 0 ? (
          <EmptyState title="Belum ada pesanan" description="Pesanan Anda akan muncul di sini.">
            <Button asChild className="mt-3">
              <Link to="/" hash="shop">Mulai Belanja</Link>
            </Button>
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {orders.data.map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => ui.openInvoice(o.id)} className="flex w-full items-center gap-4 py-4 text-left transition hover:opacity-80">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{o.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(o.created_at)} · {o.order_items.length} produk
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <StatusBadge kind="order" value={o.status} />
                      <StatusBadge kind="payment" value={o.payment_status} />
                    </div>
                  </div>
                  <p className="text-sm font-semibold">{formatRupiah(o.total)}</p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
