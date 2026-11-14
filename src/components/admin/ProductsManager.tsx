import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { adminProductsQuery, categoriesQuery, type Product } from "@/lib/queries";
import { deleteProduct } from "@/lib/admin-products";
import { formatRupiah, friendlyError, productImage } from "@/lib/format";
import { EmptyState, ErrorState, LoadingState } from "@/components/store/StateViews";
import { ProductFormDialog } from "./ProductFormDialog";

export function ProductsManager() {
  const products = useQuery(adminProductsQuery);
  const categories = useQuery(categoriesQuery);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const catName = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data],
  );
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const all = products.data ?? [];
    if (!t) return all;
    return all.filter((p) =>
      [p.name, p.tag ?? "", p.slug].some((v) => v.toLowerCase().includes(t)),
    );
  }, [products.data, q]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin_products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const toggle = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: number;
      patch: { is_active?: boolean; is_featured?: boolean };
    }) => {
      const { data, error } = await supabase
        .from("products")
        .update(patch)
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Perubahan tidak tersimpan. Pastikan akun Anda admin.");
    },
    onSuccess: refresh,
    onError: (e) => toast.error(friendlyError(e)),
  });

  const remove = useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_, p) => {
      toast.success(`${p.name} dihapus`);
      setToDelete(null);
      refresh();
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl text-foreground">Produk</h2>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <label className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari produk"
              className="h-10 w-full rounded-full bg-secondary pl-10 pr-4 text-sm outline-none ring-primary/40 focus:ring-2"
            />
          </label>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Tambah produk
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {products.isPending ? (
          <LoadingState label="Memuat produk…" />
        ) : products.isError ? (
          <ErrorState error={products.error} onRetry={() => products.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            title={q ? "Tidak ada produk yang cocok" : "Belum ada produk"}
            {...(q ? {} : { description: "Tambahkan produk pertama Anda." })}
          />
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-secondary text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Produk</th>
                  <th className="px-4 py-3 font-medium">Kategori</th>
                  <th className="px-4 py-3 font-medium">Harga</th>
                  <th className="px-4 py-3 font-medium">Stok</th>
                  <th className="px-4 py-3 font-medium">Tampil</th>
                  <th className="px-4 py-3 font-medium">Unggulan</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((p) => {
                  const stock = p.product_variants.reduce((s, v) => s + v.stock, 0);
                  const cover = p.product_images[0];
                  return (
                    <tr key={p.id} className={p.is_active ? "" : "bg-secondary/40"}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-11 shrink-0 overflow-hidden rounded-xl bg-secondary">
                            {cover && (
                              <img
                                src={productImage(cover.image_path)}
                                alt={cover.alt_text ?? p.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-2 max-w-xs font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.tag ?? "—"} · {p.product_variants.length} varian
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.product_categories
                          .map((c) => catName.get(c.category_id))
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatRupiah(p.price)}</td>
                      <td className="px-4 py-3">
                        <span className={stock === 0 ? "font-medium text-destructive" : ""}>
                          {stock === 0 ? "Habis" : stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Switch
                          aria-label={`Tampilkan ${p.name}`}
                          checked={p.is_active}
                          disabled={toggle.isPending}
                          onCheckedChange={(v) =>
                            toggle.mutate({ id: p.id, patch: { is_active: v } })
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          aria-label={p.is_featured ? "Hapus dari unggulan" : "Jadikan unggulan"}
                          aria-pressed={p.is_featured}
                          disabled={toggle.isPending}
                          onClick={() =>
                            toggle.mutate({ id: p.id, patch: { is_featured: !p.is_featured } })
                          }
                          className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary"
                        >
                          <Star
                            className={
                              p.is_featured
                                ? "h-4 w-4 fill-primary text-primary"
                                : "h-4 w-4 text-muted-foreground"
                            }
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${p.name}`}
                            onClick={() => {
                              setEditing(p);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Hapus ${p.name}`}
                            className="text-destructive hover:text-destructive"
                            onClick={() => setToDelete(p)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        categories={categories.data ?? []}
      />

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && !remove.isPending && setToDelete(null)}
      >
        <AlertDialogContent className="w-[calc(100%-1.5rem)] rounded-modal p-7">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus produk ini?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.name}" beserta foto, varian, dan stoknya akan dihapus permanen. Riwayat
              pesanan lama tetap tersimpan. Jika hanya ingin menyembunyikan, matikan "Tampil".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" disabled={remove.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={remove.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (toDelete) remove.mutate(toDelete);
              }}
            >
              {remove.isPending ? "Menghapus…" : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
