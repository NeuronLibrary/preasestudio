import { useQuery } from "@tanstack/react-query";
import { Check, Mail, MessageCircle, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { orderQuery, paymentQuery, settingsQuery, type OrderDetail } from "@/lib/queries";
import { formatDate, formatRupiah, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, productImage, waLink } from "@/lib/format";
import { useUI } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { ErrorState, LoadingState } from "./StateViews";
import { Logo } from "./Logo";

const STAGES = ["dibuat", "dikemas", "dikirim", "tiba"] as const;
const STAGE_LABEL = { dibuat: "Dibuat", dikemas: "Dikemas", dikirim: "Dikirim", tiba: "Tiba" };

export function stageIndex(status: string): number {
  return Math.max(1, STAGES.indexOf(status as (typeof STAGES)[number]));
}

export function StatusBadge({ kind, value }: { kind: "order" | "payment"; value: string }) {
  const label = kind === "order" ? ORDER_STATUS_LABEL[value] : PAYMENT_STATUS_LABEL[value];
  const tone =
    kind === "payment"
      ? value === "terverifikasi"
        ? "bg-success/10 text-success"
        : "bg-warning/15 text-warning-foreground"
      : value === "tiba"
        ? "bg-success/10 text-success"
        : value === "dikirim"
          ? "bg-primary/10 text-primary"
          : "bg-secondary text-foreground";
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", tone)}>{label ?? value}</span>;
}

function summaryText(o: OrderDetail) {
  const lines = o.order_items.map((i) => `• ${i.quantity}× ${i.product_name} (${i.color_name}, ${i.size}) — ${formatRupiah(i.line_total)}`);
  return [
    `Invoice: ${o.invoice_number}`,
    `Tanggal: ${formatDate(o.created_at)}`,
    `Nama: ${o.customer_name}`,
    "",
    ...lines,
    "",
    `Subtotal: ${formatRupiah(o.subtotal)}`,
    ...(Number(o.discount_amount) > 0 ? [`Diskon${o.voucher_code ? ` (${o.voucher_code})` : ""}: −${formatRupiah(o.discount_amount)}`] : []),
    `Ongkir (${o.shipping_method_name}): ${formatRupiah(o.shipping_cost)}`,
    `Total: ${formatRupiah(o.total)}`,
    `Pembayaran: ${o.payment_method_name} — ${PAYMENT_STATUS_LABEL[o.payment_status]}`,
    `Status: ${ORDER_STATUS_LABEL[o.status]}${o.tracking_number ? ` · Resi ${o.tracking_number}` : ""}`,
  ].join("\n");
}

export function InvoiceDialog() {
  const ui = useUI();
  const order = useQuery(orderQuery(ui.invoiceId));
  const { data: settings } = useQuery(settingsQuery);
  const payments = useQuery({ ...paymentQuery, enabled: !!ui.invoiceId });
  const o = order.data;
  const payMethod = o ? payments.data?.find((p) => p.name === o.payment_method_name) : undefined;

  return (
    <Dialog open={!!ui.invoiceId} onOpenChange={(v) => !v && ui.openInvoice(null)}>
      <DialogContent className="print-area w-[calc(100%-1.5rem)] max-w-2xl gap-0 p-0">
        {order.isPending ? (
          <div className="p-8">
            <DialogTitle className="sr-only">Invoice</DialogTitle>
            <LoadingState label="Memuat invoice…" />
          </div>
        ) : order.isError || !o ? (
          <div className="p-8">
            <DialogTitle className="sr-only">Invoice</DialogTitle>
            <ErrorState error={order.error ?? "Pesanan tidak ditemukan."} onRetry={() => order.refetch()} title="Invoice gagal dimuat" />
          </div>
        ) : (
          <>
            <div className="border-b border-border px-6 pb-6 pt-7 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Logo />
                  <DialogTitle className="mt-4 text-2xl font-semibold tracking-tight">{o.invoice_number}</DialogTitle>
                  <DialogDescription className="mt-1">{formatDate(o.created_at)}</DialogDescription>
                </div>
                <div className="mr-8 flex flex-col items-end gap-1.5">
                  <StatusBadge kind="order" value={o.status} />
                  <StatusBadge kind="payment" value={o.payment_status} />
                </div>
              </div>

              <ol className="mt-6 grid grid-cols-4">
                {STAGES.map((s, i) => {
                  const done = i <= stageIndex(o.status);
                  return (
                    <li key={s} className="relative flex flex-col items-center text-center">
                      {i > 0 && <span className={cn("absolute right-1/2 top-3.5 h-0.5 w-full", done ? "bg-primary" : "bg-border")} />}
                      <span className={cn("relative z-10 grid h-7 w-7 place-items-center rounded-full", done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                        {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                      </span>
                      <span className={cn("mt-2 text-xs", done ? "font-medium text-foreground" : "text-muted-foreground")}>{STAGE_LABEL[s]}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="space-y-6 px-6 py-6 sm:px-8">
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Penerima</p>
                  <p className="mt-1 font-medium">{o.customer_name}</p>
                  <p className="text-muted-foreground">{o.customer_whatsapp} · {o.customer_email}</p>
                  <p className="mt-1 text-muted-foreground">
                    {o.shipping_address}, {o.city}, {o.province} {o.postal_code}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pengiriman</p>
                  <p className="mt-1 font-medium">{o.shipping_method_name}</p>
                  <p className="text-muted-foreground">
                    Resi: {o.tracking_number ? <span className="font-mono font-medium text-foreground">{o.tracking_number}</span> : "Belum tersedia"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">Pembayaran</p>
                  <p className="mt-1 font-medium">{o.payment_method_name}</p>
                  {o.payment_status === "menunggu_verifikasi" && payMethod?.account_number && (
                    <p className="text-muted-foreground">
                      Transfer ke <span className="font-mono font-medium text-foreground">{payMethod.account_number}</span>
                      {payMethod.account_name ? ` a.n. ${payMethod.account_name}` : ""}
                    </p>
                  )}
                </div>
              </div>

              <ul className="divide-y divide-border rounded-2xl border border-border">
                {o.order_items.map((it) => (
                  <li key={it.id} className="flex items-center gap-4 p-4">
                    <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {it.image_path && <img src={productImage(it.image_path)} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{it.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.color_name} · {it.size} · {it.quantity} × {formatRupiah(it.unit_price)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatRupiah(it.line_total)}</p>
                  </li>
                ))}
              </ul>

              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatRupiah(o.subtotal)}</dd>
                </div>
                {Number(o.discount_amount) > 0 && (
                  <div className="flex justify-between text-success">
                    <dt>Diskon{o.voucher_code ? ` (${o.voucher_code})` : ""}</dt>
                    <dd>−{formatRupiah(o.discount_amount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Ongkos kirim</dt>
                  <dd>{Number(o.shipping_cost) === 0 ? "Gratis" : formatRupiah(o.shipping_cost)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-lg font-semibold">
                  <dt>Total</dt>
                  <dd>{formatRupiah(o.total)}</dd>
                </div>
              </dl>
            </div>

            <div className="no-print flex flex-wrap gap-2 border-t border-border px-6 py-4 sm:px-8">
              {settings?.whatsapp_number && (
                <Button variant="whatsapp" asChild>
                  <a href={waLink(settings.whatsapp_number, `Halo ${settings.store_name}, berikut pesanan saya:\n\n${summaryText(o)}`)} target="_blank" rel="noreferrer">
                    <MessageCircle /> Kirim WhatsApp
                  </a>
                </Button>
              )}
              {settings?.email && (
                <Button variant="secondary" asChild>
                  <a href={`mailto:${settings.email}?cc=${encodeURIComponent(o.customer_email)}&subject=${encodeURIComponent(`Pesanan ${o.invoice_number}`)}&body=${encodeURIComponent(summaryText(o))}`}>
                    <Mail /> Kirim Email
                  </a>
                </Button>
              )}
              <Button variant="ink" onClick={() => window.print()}>
                <Printer /> Cetak PDF
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
