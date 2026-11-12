import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useUI } from "@/lib/ui";
import { formatRupiah, productImage } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const ui = useUI();
  const cart = useCart();
  const { user } = useAuth();
  const [code, setCode] = useState("");

  const checkout = () => {
    ui.setCartOpen(false);
    if (!user) {
      ui.openAuth("login", () => ui.setCheckoutOpen(true));
      return;
    }
    ui.setCheckoutOpen(true);
  };

  return (
    <Sheet open={ui.cartOpen} onOpenChange={ui.setCartOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-5 text-left">
          <SheetTitle className="text-xl tracking-tight">Keranjang</SheetTitle>
          <SheetDescription>{cart.count > 0 ? `${cart.count} barang` : "Belum ada barang"}</SheetDescription>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-secondary">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </span>
            <p className="font-semibold">Keranjang Anda kosong</p>
            <p className="text-sm text-muted-foreground">Temukan koleksi vintage favorit Anda.</p>
            <Button className="mt-2" onClick={() => ui.setCartOpen(false)} asChild>
              <Link to="/" hash="shop">Mulai Belanja</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-6">
              {cart.items.map((it) => (
                <li key={it.variant_id} className="flex gap-4 py-5">
                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    {it.image_path && <img src={productImage(it.image_path)} alt={it.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug">{it.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {it.color_name} · {it.size}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full bg-secondary">
                        <button type="button" className="grid h-8 w-8 place-items-center disabled:opacity-30" disabled={it.quantity <= 1} onClick={() => cart.setQuantity(it.variant_id, it.quantity - 1)} aria-label="Kurangi">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{it.quantity}</span>
                        <button type="button" className="grid h-8 w-8 place-items-center disabled:opacity-30" disabled={it.quantity >= it.stock} onClick={() => cart.setQuantity(it.variant_id, it.quantity + 1)} aria-label="Tambah">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold">{formatRupiah(it.price * it.quantity)}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => cart.remove(it.variant_id)} className="self-start text-muted-foreground hover:text-destructive" aria-label="Hapus">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="border-t border-border bg-secondary px-6 py-5">
              {cart.voucher?.valid ? (
                <div className="mb-4 flex items-center justify-between rounded-xl bg-background px-3 py-2.5 text-sm">
                  <span className="flex items-center gap-2 font-medium text-success">
                    <Tag className="h-4 w-4" /> {cart.voucher.code} (−{cart.voucher.discount_percent}%)
                  </span>
                  <button type="button" onClick={cart.removeVoucher} aria-label="Hapus voucher" className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <form
                  className="mb-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void cart.applyVoucher(code);
                  }}
                >
                  <div className="flex gap-2">
                    <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Kode voucher" className="h-10 uppercase" maxLength={40} />
                    <Button type="submit" variant="ink" disabled={!code.trim() || cart.voucherLoading}>
                      {cart.voucherLoading ? "Memeriksa…" : "Pakai"}
                    </Button>
                  </div>
                  {cart.voucher && !cart.voucher.valid && <p className="mt-2 text-xs text-destructive">{cart.voucher.message}</p>}
                </form>
              )}

              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatRupiah(cart.subtotal)}</dd>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-success">
                    <dt>Diskon</dt>
                    <dd>−{formatRupiah(cart.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <dt>Ongkos kirim</dt>
                  <dd>Dihitung saat checkout</dd>
                </div>
                <div className={cn("flex justify-between border-t border-border pt-2 text-base font-semibold")}>
                  <dt>Total</dt>
                  <dd>{formatRupiah(cart.subtotal - cart.discount)}</dd>
                </div>
              </dl>
              <Button size="lg" className="mt-4 w-full" onClick={checkout}>
                Checkout
              </Button>
              {!user && <p className="mt-2 text-center text-xs text-muted-foreground">Anda perlu masuk untuk checkout.</p>}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
