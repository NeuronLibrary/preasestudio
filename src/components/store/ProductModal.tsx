import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, Minus, Plus, Star, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { productsQuery, settingsQuery, type Product } from "@/lib/queries";
import { formatRupiah, productImage, waLink } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useUI } from "@/lib/ui";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

export function ProductModal() {
  const ui = useUI();
  const { data: products } = useQuery(productsQuery);
  const fresh = ui.product ? (products?.find((p) => p.id === ui.product!.id) ?? ui.product) : null;
  return (
    <Dialog open={!!ui.product} onOpenChange={(o) => !o && ui.openProduct(null)}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-4xl gap-0 p-0">
        {fresh && <ProductDetail key={fresh.id} product={fresh} />}
      </DialogContent>
    </Dialog>
  );
}

function ProductDetail({ product }: { product: Product }) {
  const cart = useCart();
  const ui = useUI();
  const wishlist = useWishlist();
  const { data: settings } = useQuery(settingsQuery);
  const colors = useMemo(() => {
    const map = new Map<string, string>();
    product.product_variants.forEach((v) => map.set(v.color_name, v.color_hex));
    return [...map.entries()].map(([name, hex]) => ({ name, hex }));
  }, [product]);

  const firstAvailable = product.product_variants.find((v) => v.stock > 0) ?? product.product_variants[0];
  const [color, setColor] = useState(firstAvailable?.color_name ?? "");
  const [variantId, setVariantId] = useState<number | null>(firstAvailable && firstAvailable.stock > 0 ? firstAvailable.id : null);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  const sizes = product.product_variants.filter((v) => v.color_name === color);
  const variant = product.product_variants.find((v) => v.id === variantId) ?? null;
  const inCart = cart.items.find((i) => i.variant_id === variantId)?.quantity ?? 0;
  const maxQty = variant ? Math.max(0, variant.stock - inCart) : 0;
  const images = product.product_images;
  const liked = wishlist.has(product.id);

  const pickColor = (c: string) => {
    setColor(c);
    const v = product.product_variants.find((x) => x.color_name === c && x.stock > 0);
    setVariantId(v?.id ?? null);
    setQty(1);
  };

  const addToCart = () => {
    if (!variant) {
      toast.error("Pilih ukuran terlebih dahulu");
      return;
    }
    const { added, capped } = cart.add(
      {
        variant_id: variant.id,
        product_id: product.id,
        name: product.name,
        color_name: variant.color_name,
        size: variant.size,
        price: Number(product.price),
        image_path: images[0]?.image_path ?? null,
        stock: variant.stock,
      },
      qty,
    );
    if (added === 0) {
      toast.error("Jumlah di keranjang sudah mencapai stok tersedia");
      return;
    }
    toast.success("Ditambahkan ke keranjang", {
      description: `${added}× ${product.name} · ${variant.size}${capped ? " (disesuaikan dengan stok)" : ""}`,
      action: { label: "Lihat", onClick: () => ui.setCartOpen(true) },
    });
    setQty(1);
    ui.openProduct(null);
  };

  const buyWhatsApp = () => {
    if (!settings?.whatsapp_number) {
      toast.error("Nomor WhatsApp toko belum tersedia");
      return;
    }
    const text = `Halo ${settings.store_name}, saya ingin membeli:\n\n${product.name}\nWarna: ${variant?.color_name ?? color}\nUkuran: ${variant?.size ?? "-"}\nJumlah: ${qty}\nHarga: ${formatRupiah(Number(product.price) * qty)}\n\nApakah masih tersedia?`;
    window.open(waLink(settings.whatsapp_number, text), "_blank", "noopener");
  };

  return (
    <div className="grid md:grid-cols-2">
      <div className="bg-secondary p-4 sm:p-6">
        <div className="overflow-hidden rounded-2xl bg-background">
          {images[imgIdx] ? (
            <img src={productImage(images[imgIdx].image_path)} alt={images[imgIdx].alt_text ?? product.name} className="aspect-[4/5] w-full object-cover" />
          ) : (
            <div className="aspect-[4/5] w-full" />
          )}
        </div>
        {images.length > 1 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.image_path + i}
                type="button"
                onClick={() => setImgIdx(i)}
                className={cn("h-16 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition", i === imgIdx ? "border-primary" : "border-transparent opacity-70")}
              >
                <img src={productImage(img.image_path)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col p-6 sm:p-8">
        {product.tag && <p className="text-sm font-medium text-primary">{product.tag}</p>}
        <DialogTitle className="mt-1 pr-8 text-2xl font-semibold leading-tight tracking-tight">{product.name}</DialogTitle>
        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="h-4 w-4 fill-foreground text-foreground" />
          <span className="font-medium text-foreground">{Number(product.rating_avg).toFixed(1)}</span>
          <span>· {product.review_count} ulasan</span>
        </div>
        <p className="mt-4 text-2xl font-semibold text-foreground">{formatRupiah(product.price)}</p>
        <DialogDescription className="mt-4 whitespace-pre-line text-[15px] leading-relaxed">
          {product.description || "Tidak ada deskripsi."}
        </DialogDescription>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-foreground">
            Warna <span className="font-normal text-muted-foreground">· {color}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => pickColor(c.name)}
                aria-label={c.name}
                title={c.name}
                className={cn("grid h-9 w-9 place-items-center rounded-full border-2 transition", color === c.name ? "border-primary" : "border-transparent")}
              >
                <span className="h-7 w-7 rounded-full border border-foreground/10" style={{ backgroundColor: c.hex }} />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-foreground">Ukuran</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={v.stock === 0}
                onClick={() => {
                  setVariantId(v.id);
                  setQty(1);
                }}
                className={cn(
                  "h-10 min-w-14 rounded-xl border px-4 text-sm font-medium transition",
                  variantId === v.id ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-foreground/40",
                  v.stock === 0 && "cursor-not-allowed text-muted-foreground line-through opacity-50 hover:border-border",
                )}
              >
                {v.size}
              </button>
            ))}
          </div>
          {variant && (
            <p className="mt-2 text-xs text-muted-foreground">
              Stok tersedia: {variant.stock}
              {inCart > 0 ? ` · ${inCart} di keranjang` : ""}
            </p>
          )}
          {!variant && <p className="mt-2 text-xs text-destructive">Semua ukuran untuk warna ini habis.</p>}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <p className="text-sm font-medium text-foreground">Jumlah</p>
          <div className="flex items-center rounded-full bg-secondary">
            <button type="button" className="grid h-9 w-9 place-items-center disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Kurangi">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-semibold">{qty}</span>
            <button type="button" className="grid h-9 w-9 place-items-center disabled:opacity-30" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="Tambah">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <Button size="lg" onClick={addToCart} disabled={!variant || maxQty === 0}>
            {!variant ? "Habis" : maxQty === 0 ? "Stok sudah di keranjang" : "Masukkan ke Keranjang"}
          </Button>
          <div className="flex gap-2">
            <Button size="lg" variant="whatsapp" className="flex-1" onClick={buyWhatsApp}>
              <MessageCircle /> Beli via WhatsApp
            </Button>
            <Button size="lg" variant="secondary" className="w-12 px-0" onClick={() => wishlist.toggle(product.id)} aria-label="Wishlist" aria-pressed={liked}>
              <Heart className={cn(liked && "fill-destructive text-destructive")} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
