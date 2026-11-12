import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BadgeCheck, Clock, Package, Search, ShoppingCart, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth";
import { useUI } from "@/lib/ui";
import { adminOrdersQuery, adminStatsQuery } from "@/lib/queries";
import { formatDate, formatRupiah, friendlyError } from "@/lib/format";
import { ErrorState, LoadingState, EmptyState } from "@/components/store/StateViews";
import { StatusBadge } from "@/components/store/InvoiceDialog";

type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
type AdminOrder = Awaited<ReturnType<typeof adminOrdersQuery.queryFn & {}>>[number];

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Dashboard Admin — PreaseStudios" },
      { name: "description", content: "Kelola pesanan, pembayaran, dan pengiriman PreaseStudios." },
      { property: "og:title", content: "Dashboard Admin — PreaseStudios" },
      { property: "og:description", content: "Panel admin PreaseStudios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading, profile, isAdmin } = useAuth();
  const ui = useUI();
  if (loading || (user && profile === undefined)) return <div className="pt-32"><LoadingState /></div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 pb-24 pt-36 text-center">
        <h1 className="text-4xl text-foreground">Dashboard Admin</h1>
        <p className="mt-3 text-muted-foreground">Masuk dengan akun admin untuk melanjutkan.</p>
        <Button size="lg" className="mt-8" onClick={() => ui.openAuth("login")}>Masuk</Button>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-6 pb-24 pt-36 text-center">
        <h1 className="text-4xl text-foreground">Akses ditolak</h1>
        <p className="mt-3 text-muted-foreground">Halaman ini hanya untuk admin PreaseStudios.</p>
      </div>
    );
  }
  return <Dashboard />;
}

function Dashboard() {
  const stats = useQuery(adminStatsQuery);
  const s = stats.data;
  const kpis = s
    ? [
        { icon: ShoppingCart, label: "Total Pesanan", value: s.total_orders.toLocaleString("id-ID") },
        { icon: Wallet, label: "Total Pendapatan", value: formatRupiah(s.total_revenue) },
        { icon: Package, label: "Barang Terjual", value: s.items_sold.toLocaleString("id-ID") },
        { icon: Clock, label: "Perlu Dikemas", value: s.pending_orders.toLocaleString("id-ID") },
      ]
    : [];
  const chartData = (s?.daily_sales ?? []).map((d) => ({
    ...d,
    revenue: Number(d.revenue),
    label: new Date(d.date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric" }),
  }));

  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-24 pt-28 sm:px-6">
      <h1 className="text-headline text-foreground">Dashboard.</h1>
      <p className="mt-2 text-muted-foreground">Ringkasan toko dan pengelolaan pesanan.</p>

      {stats.isError ? (
        <ErrorState className="mt-8" error={stats.error} onRetry={() => stats.refetch()} />
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.isPending
              ? [1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-pulse rounded-card bg-secondary" />)
              : kpis.map((k) => (
                  <div key={k.label} className="rounded-card bg-secondary p-5 sm:p-6">
                    <k.icon className="h-5 w-5 text-primary" />
                    <p className="mt-4 truncate text-2xl font-semibold tracking-tight sm:text-3xl">{k.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{k.label}</p>
                  </div>
                ))}
          </div>

          <div className="mt-4 rounded-card border border-border p-5 sm:p-6">
            <h2 className="text-lg text-foreground">Penjualan 7 hari terakhir</h2>
            <div className="mt-4 h-64">
              {stats.isPending ? (
                <div className="h-full animate-pulse rounded-2xl bg-secondary" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      width={64}
                      stroke="var(--color-muted-foreground)"
                      tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toLocaleString("id-ID")} jt` : v.toLocaleString("id-ID"))}
                    />
                    <Tooltip
                      formatter={(v: number) => [formatRupiah(v), "Pendapatan"]}
                      contentStyle={{ borderRadius: 14, border: "1px solid var(--color-border)", fontSize: 13 }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} fill="url(#rev)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      <OrdersTable />
    </div>
  );
}

function OrdersTable() {
  const orders = useQuery(adminOrdersQuery);
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return orders.data ?? [];
    return (orders.data ?? []).filter((o) =>
      [o.invoice_number, o.customer_name, o.customer_whatsapp, o.city].some((v) => v.toLowerCase().includes(t)),
    );
  }, [orders.data, q]);

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl text-foreground">Pesanan</h2>
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari invoice / pelanggan"
            className="h-10 w-full rounded-full bg-secondary pl-10 pr-4 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </label>
      </div>
      <div className="mt-4">
        {orders.isPending ? (
          <LoadingState label="Memuat pesanan…" />
        ) : orders.isError ? (
          <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState title={q ? "Tidak ada pesanan yang cocok" : "Belum ada pesanan"} />
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-secondary text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Pelanggan</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Pembayaran</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">No. Resi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function OrderRow({ order }: { order: AdminOrder }) {
  const ui = useUI();
  const qc = useQueryClient();
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  useEffect(() => setTracking(order.tracking_number ?? ""), [order.tracking_number]);

  const update = useMutation({
    mutationFn: async (patch: OrderUpdate) => {
      const { data, error } = await supabase.from("orders").update(patch).eq("id", order.id).select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Perubahan tidak tersimpan. Pastikan akun Anda admin.");
    },
    onSuccess: () => {
      toast.success(`Pesanan ${order.invoice_number} diperbarui`);
      qc.invalidateQueries({ queryKey: ["admin_orders"] });
      qc.invalidateQueries({ queryKey: ["admin_stats"] });
      qc.invalidateQueries({ queryKey: ["order", order.id] });
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  return (
    <tr className="align-middle">
      <td className="px-4 py-3">
        <button type="button" onClick={() => ui.openInvoice(order.id)} className="font-semibold text-primary hover:underline">
          {order.invoice_number}
        </button>
        <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium">{order.customer_name}</p>
        <p className="text-xs text-muted-foreground">{order.customer_whatsapp} · {order.city}</p>
      </td>
      <td className="px-4 py-3">
        <p className="font-semibold">{formatRupiah(order.total)}</p>
        <p className="text-xs text-muted-foreground">{order.payment_method_name}</p>
      </td>
      <td className="px-4 py-3">
        {order.payment_status === "terverifikasi" ? (
          <StatusBadge kind="payment" value={order.payment_status} />
        ) : (
          <div className="flex flex-col items-start gap-1.5">
            <StatusBadge kind="payment" value={order.payment_status} />
            <Button size="sm" variant="outline-primary" disabled={update.isPending} onClick={() => update.mutate({ payment_status: "terverifikasi" })}>
              <BadgeCheck /> Verifikasi
            </Button>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <Select value={order.status} onValueChange={(v) => update.mutate({ status: v as OrderUpdate["status"] })} disabled={update.isPending}>
          <SelectTrigger className="h-9 w-32 rounded-full" aria-label="Ubah status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="dikemas">Dikemas</SelectItem>
            <SelectItem value="dikirim">Dikirim</SelectItem>
            <SelectItem value="tiba">Tiba</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3">
        <form
          className="flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate({ tracking_number: tracking.trim() || null });
          }}
        >
          <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Input resi" className="h-9 w-36 font-mono text-xs" maxLength={60} />
          <Button size="sm" type="submit" variant="ink" className="h-9" disabled={update.isPending || tracking.trim() === (order.tracking_number ?? "")}>
            Simpan
          </Button>
        </form>
      </td>
    </tr>
  );
}
