import { Heart, Star, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/queries";
import { formatRupiah, productImage } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useUI } from "@/lib/ui";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

export function totalStock(p: Product) {
  return p.product_variants.reduce((s, v) => s + v.stock, 0);
}

export function ProductCard({ product }: { product: Product }) {
  const ui = useUI();
  const cart = useCart();
  const wishlist = useWishlist();
  const stock = totalStock(product);
  const soldOut = stock === 0;
  const image = product.product_images[0];
  const inStock = product.product_variants.filter((v) => v.stock > 0);
  const liked = wishlist.has(product.id);

  const quickAdd = () => {
    if (inStock.length !== 1) {
      ui.openProduct(product);
      return;
    }
    const v = inStock[0];
    const { added } = cart.add(
      {
        variant_id: v.id,
        product_id: product.id,
        name: product.name,
        color_name: v.color_name,
        size: v.size,
        price: Number(product.price),
        image_path: image?.image_path ?? null,
        stock: v.stock,
      },
      1,
    );
    if (added > 0) toast.success("Ditambahkan ke keranjang", { description: `${product.name} · ${v.size}` });
    else toast.error("Stok di keranjang sudah maksimal");
  };

  return (
    <article className="group flex flex-col">
      <div className="relative overflow-hidden rounded-card bg-secondary">
        <button
          type="button"
          onClick={() => ui.openProduct(product)}
          className="block w-full cursor-pointer"
          aria-label={`Lihat detail ${product.name}`}
        >
          {image ? (
            <img
              src={productImage(image.image_path)}
              alt={image.alt_text ?? product.name}
              loading="lazy"
              className={cn(
                "aspect-[4/5] w-full object-cover transition-transform duration-700 ease-apple group-hover:scale-[1.04]",
                soldOut && "opacity-50 grayscale",
              )}
            />
          ) : (
            <div className="aspect-[4/5] w-full" />
          )}
        </button>
        <div className="pointer-events-none absolute left-3 top-3 flex gap-1.5">
          {product.tag && (
            <span className="rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur">
              {product.tag}
            </span>
          )}
          {soldOut && (
            <span className="rounded-full bg-foreground px-2.5 py-1 text-[11px] font-medium text-background">Habis</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => wishlist.toggle(product.id)}
          aria-label={liked ? "Hapus dari wishlist" : "Tambah ke wishlist"}
          aria-pressed={liked}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 backdrop-blur transition-transform hover:scale-105"
        >
          <Heart className={cn("h-4 w-4", liked ? "fill-destructive text-destructive" : "text-foreground")} />
        </button>
      </div>

      <div className="mt-4 flex flex-1 flex-col px-1">
        <button type="button" onClick={() => ui.openProduct(product)} className="text-left">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">{product.name}</h3>
        </button>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
          <span className="font-medium text-foreground">{Number(product.rating_avg).toFixed(1)}</span>
          <span>({product.review_count} ulasan)</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <p className="text-base font-semibold text-foreground">{formatRupiah(product.price)}</p>
          <Button size="sm" onClick={quickAdd} disabled={soldOut} variant={soldOut ? "secondary" : "default"}>
            {soldOut ? "Habis" : (<><Plus /> Keranjang</>)}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] rounded-card bg-secondary" />
      <div className="mt-4 h-4 w-3/4 rounded-full bg-secondary" />
      <div className="mt-2 h-3 w-1/3 rounded-full bg-secondary" />
      <div className="mt-4 h-5 w-1/2 rounded-full bg-secondary" />
    </div>
  );
}
