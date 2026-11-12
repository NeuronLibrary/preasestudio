import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { paymentQuery, shippingQuery } from "@/lib/queries";
import { formatRupiah, friendlyError } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useUI } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState, LoadingState } from "./StateViews";

type Recipient = {
  name: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  province: string;
  postal: string;
};

const STEPS = ["Data Penerima", "Kurir", "Pembayaran"];
const PAYMENT_TYPE_LABEL: Record<string, string> = { bank_transfer: "Transfer Bank", ewallet: "E-Wallet", cod: "Bayar di Tempat" };

export function validateRecipient(r: Recipient): string | null {
  if (r.name.trim().length < 2) return "Nama penerima wajib diisi.";
  if (!/^(\+?62|0)8\d{7,12}$/.test(r.whatsapp.replace(/[\s-]/g, ""))) return "Nomor WhatsApp tidak valid (contoh: 081234567890).";
  if (!/^\S+@\S+\.\S+$/.test(r.email.trim())) return "Format email tidak valid.";
  if (r.address.trim().length < 10) return "Alamat lengkap minimal 10 karakter.";
  if (!r.city.trim()) return "Kota wajib diisi.";
  if (!r.province.trim()) return "Provinsi wajib diisi.";
  if (!/^\d{5}$/.test(r.postal.trim())) return "Kode pos harus 5 digit.";
  return null;
}

export function CheckoutDialog() {
  const ui = useUI();
  const cart = useCart();
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const shipping = useQuery({ ...shippingQuery, enabled: ui.checkoutOpen });
  const payment = useQuery({ ...paymentQuery, enabled: ui.checkoutOpen });

  const [step, setStep] = useState(0);
  const [r, setR] = useState<Recipient>({ name: "", whatsapp: "", email: "", address: "", city: "", province: "", postal: "" });
  const [shipId, setShipId] = useState<number | null>(null);
  const [payId, setPayId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!ui.checkoutOpen) return;
    setStep(0);
    setError(null);
    setR((prev) => ({
      ...prev,
      name: prev.name || profile?.full_name || "",
      whatsapp: prev.whatsapp || profile?.phone || "",
      email: prev.email || user?.email || "",
    }));
  }, [ui.checkoutOpen, profile, user]);

  const ship = shipping.data?.find((s) => s.id === shipId);
  const pay = payment.data?.find((p) => p.id === payId);
  const shipCost = Number(ship?.cost ?? 0);
  const total = cart.subtotal - cart.discount + shipCost;

  const next = () => {
    setError(null);
    if (step === 0) {
      const err = validateRecipient(r);
      if (err) return setError(err);
    }
    if (step === 1 && !shipId) return setError("Pilih metode pengiriman.");
    setStep((s) => s + 1);
  };

  const submit = async () => {
    setError(null);
    if (!payId || !shipId) return setError("Pilih metode pembayaran.");
    if (cart.items.length === 0) return setError("Keranjang kosong.");
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("create_order", {
        p_customer_name: r.name.trim(),
        p_whatsapp: r.whatsapp.replace(/[\s-]/g, ""),
        p_email: r.email.trim(),
        p_address: r.address.trim(),
        p_city: r.city.trim(),
        p_province: r.province.trim(),
        p_postal_code: r.postal.trim(),
        p_shipping_method_id: shipId,
        p_payment_method_id: payId,
        p_voucher_code: cart.voucher?.valid ? cart.voucher.code : "",
        p_items: cart.items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
      });
      if (error) throw error;
      const res = data as { order_id: string; invoice_number: string; total: number };
      cart.clear();
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["my_orders"] });
      ui.setCheckoutOpen(false);
      toast.success(`Pesanan ${res.invoice_number} berhasil dibuat`);
      ui.openInvoice(res.order_id);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof Recipient, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`co-${key}`}>{label}</Label>
      <Input id={`co-${key}`} value={r[key]} onChange={(e) => setR({ ...r, [key]: e.target.value })} {...props} />
    </div>
  );

  return (
    <Dialog open={ui.checkoutOpen} onOpenChange={(o) => !submitting && ui.setCheckoutOpen(o)}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-2xl gap-0 p-0">
        <div className="border-b border-border px-6 pb-5 pt-6 sm:px-8">
          <DialogTitle className="text-2xl font-semibold tracking-tight">Checkout</DialogTitle>
          <DialogDescription className="mt-1">Harga dan stok akhir dihitung ulang oleh sistem saat pesanan dibuat.</DialogDescription>
          <ol className="mt-5 flex items-center gap-2">
            {STEPS.map((label, i) => (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
                    i < step ? "bg-success text-success-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={cn("hidden text-sm sm:block", i === step ? "font-medium text-foreground" : "text-muted-foreground")}>{label}</span>
                {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
              </li>
            ))}
          </ol>
        </div>

        <div className="px-6 py-6 sm:px-8">
          {cart.items.length === 0 ? (
            <EmptyState title="Keranjang kosong" description="Tambahkan produk terlebih dahulu." />
          ) : step === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {field("name", "Nama penerima", { autoComplete: "name", maxLength: 80 })}
              {field("whatsapp", "Nomor WhatsApp", { inputMode: "tel", placeholder: "081234567890", maxLength: 16 })}
              <div className="sm:col-span-2">{field("email", "Email", { type: "email", autoComplete: "email" })}</div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="co-address">Alamat lengkap</Label>
                <Textarea id="co-address" rows={3} className="rounded-xl" value={r.address} onChange={(e) => setR({ ...r, address: e.target.value })} placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan" maxLength={300} />
              </div>
              {field("city", "Kota / Kabupaten", { maxLength: 60 })}
              {field("province", "Provinsi", { maxLength: 60 })}
              {field("postal", "Kode pos", { inputMode: "numeric", maxLength: 5 })}
            </div>
          ) : step === 1 ? (
            shipping.isPending ? (
              <LoadingState label="Memuat metode pengiriman…" />
            ) : shipping.isError ? (
              <ErrorState error={shipping.error} onRetry={() => shipping.refetch()} />
            ) : shipping.data.length === 0 ? (
              <EmptyState title="Belum ada metode pengiriman" description="Toko belum menyiapkan kurir. Silakan hubungi kami via WhatsApp." />
            ) : (
              <div className="space-y-3">
                {shipping.data.map((s) => (
                  <OptionCard key={s.id} active={shipId === s.id} onClick={() => setShipId(s.id)} title={s.name} description={s.description} right={Number(s.cost) === 0 ? "Gratis" : formatRupiah(s.cost)} />
                ))}
              </div>
            )
          ) : payment.isPending ? (
            <LoadingState label="Memuat metode pembayaran…" />
          ) : payment.isError ? (
            <ErrorState error={payment.error} onRetry={() => payment.refetch()} />
          ) : payment.data.length === 0 ? (
            <EmptyState title="Belum ada metode pembayaran" description="Silakan hubungi kami via WhatsApp." />
          ) : (
            <div className="space-y-5">
              <div className="space-y-3">
                {payment.data.map((p) => (
                  <OptionCard
                    key={p.id}
                    active={payId === p.id}
                    onClick={() => setPayId(p.id)}
                    title={p.name}
                    description={p.description}
                    right={PAYMENT_TYPE_LABEL[p.type] ?? p.type}
                  >
                    {payId === p.id && p.account_number && (
                      <div className="mt-3 rounded-xl bg-secondary px-4 py-3 text-sm">
                        <p className="text-xs text-muted-foreground">Nomor rekening / akun</p>
                        <p className="mt-0.5 font-mono text-base font-semibold tracking-wide">{p.account_number}</p>
                        {p.account_name && <p className="text-xs text-muted-foreground">a.n. {p.account_name}</p>}
                      </div>
                    )}
                  </OptionCard>
                ))}
              </div>
              <dl className="space-y-1.5 rounded-2xl bg-secondary p-5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal ({cart.count} barang)</dt>
                  <dd>{formatRupiah(cart.subtotal)}</dd>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-success">
                    <dt>Diskon {cart.voucher?.code}</dt>
                    <dd>−{formatRupiah(cart.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Ongkir · {ship?.name}</dt>
                  <dd>{shipCost === 0 ? "Gratis" : formatRupiah(shipCost)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd>{formatRupiah(total)}</dd>
                </div>
              </dl>
              {pay && <p className="text-xs text-muted-foreground">Pembayaran akan diverifikasi manual oleh tim kami setelah pesanan dibuat.</p>}
            </div>
          )}

          {error && <p className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        </div>

        {cart.items.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4 sm:px-8">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => { setError(null); setStep((s) => s - 1); }} disabled={submitting}>
                <ChevronLeft /> Kembali
              </Button>
            ) : (
              <span />
            )}
            {step < 2 ? (
              <Button onClick={next} disabled={step === 1 && (shipping.data?.length ?? 0) === 0}>Lanjut</Button>
            ) : (
              <Button onClick={submit} disabled={submitting || !payId}>
                {submitting && <Loader2 className="animate-spin" />} Buat Pesanan
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OptionCard({
  active,
  onClick,
  title,
  description,
  right,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description?: string | null;
  right?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="radio"
      aria-checked={active}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={cn(
        "cursor-pointer rounded-2xl border-2 p-4 transition",
        active ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2", active ? "border-primary" : "border-border")}>
            {active && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
          </span>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {right && <span className="shrink-0 text-sm font-medium">{right}</span>}
      </div>
      {children}
    </div>
  );
}
