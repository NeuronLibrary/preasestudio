import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { filterAndSortProducts, type SortKey } from "@/lib/shop";
import { useUI } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import { EmptyState, ErrorState } from "./StateViews";
import { Reveal } from "./Reveal";

export function Shop() {
  const ui = useUI();
  const products = useQuery(productsQuery);
  const categories = useQuery(categoriesQuery);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("populer");

  const list = useMemo(
    () => filterAndSortProducts(products.data ?? [], { categoryId, search: ui.search, sort }),
    [products.data, categoryId, ui.search, sort],
  );

  return (
    <section id="shop" className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <Reveal className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-headline text-foreground">
            Shop. <span className="text-muted-foreground">Koleksi terbaru.</span>
          </h2>
        </Reveal>

        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            {categories.isError ? (
              <span className="text-sm text-muted-foreground">Kategori gagal dimuat.</span>
            ) : (
              [{ id: null as number | null, name: "Semua" }, ...(categories.data ?? [])].map((c) => (
                <button
                  key={c.id ?? "all"}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
                    categoryId === c.id
                      ? "bg-foreground text-background"
                      : "bg-secondary text-foreground hover:bg-accent",
                  )}
                >
                  {c.name}
                </button>
              ))
            )}
            {categories.isPending &&
              [1, 2, 3].map((i) => <span key={i} className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-secondary" />)}
          </div>

          <div className="flex gap-2">
            <label className="relative flex-1 lg:w-64">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={ui.search}
                onChange={(e) => ui.setSearch(e.target.value)}
                placeholder="Cari produk"
                aria-label="Cari produk"
                className="h-10 w-full rounded-full bg-secondary pl-10 pr-4 text-sm outline-none ring-primary/40 transition focus:ring-2"
              />
            </label>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-10 w-[170px] rounded-full border-0 bg-secondary px-4 shadow-none" aria-label="Urutkan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="populer">Terpopuler</SelectItem>
                <SelectItem value="harga-naik">Harga terendah</SelectItem>
                <SelectItem value="harga-turun">Harga tertinggi</SelectItem>
                <SelectItem value="rating">Rating tertinggi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {products.isPending ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.isError ? (
          <ErrorState error={products.error} onRetry={() => products.refetch()} title="Produk gagal dimuat" />
        ) : list.length === 0 ? (
          <EmptyState
            title="Produk tidak ditemukan"
            description={ui.search ? `Tidak ada hasil untuk “${ui.search}”. Coba kata kunci lain.` : "Belum ada produk di kategori ini."}
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {list.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 70}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
