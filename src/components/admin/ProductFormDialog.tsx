import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/lib/queries";
import { draftFromProduct, emptyDraft, newKey, saveProduct } from "@/lib/admin-products";
import {
  MAX_IMAGE_BYTES,
  SIZES,
  makeSku,
  slugify,
  validateProductDraft,
  type ProductDraft,
  type VariantDraft,
} from "@/lib/product-form";
import { formatRupiah, friendlyError } from "@/lib/format";
import { cn } from "@/lib/utils";

type Category = { id: number; name: string };

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product: Product | null;
  categories: Category[];
}) {
  const qc = useQueryClient();
  const [d, setD] = useState<ProductDraft>(emptyDraft);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!product;

  useEffect(() => {
    if (!open) return;
    setD(product ? draftFromProduct(product) : emptyDraft());
    setSlugTouched(!!product);
    setError(null);
  }, [open, product]);

  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) =>
    setD((p) => ({ ...p, [k]: v }));
  const setVariant = (key: string, patch: Partial<VariantDraft>) =>
    setD((p) => ({
      ...p,
      variants: p.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)),
    }));

  const addVariant = () =>
    setD((p) => {
      const last = p.variants[p.variants.length - 1];
      const color = last?.color_name ?? "";
      const hex = last?.color_hex ?? "#1d1d1f";
      const used = new Set(p.variants.filter((v) => v.color_name === color).map((v) => v.size));
      const size = SIZES.find((s) => !used.has(s)) ?? "M";
      return {
        ...p,
        variants: [
          ...p.variants,
          {
            key: newKey(),
            color_name: color,
            color_hex: hex,
            size,
            stock: 1,
            sku: color ? makeSku(p.slug, color, size) : "",
          },
        ],
      };
    });

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted = Array.from(files).filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} bukan file gambar.`);
        return false;
      }
      if (f.size > MAX_IMAGE_BYTES) {
        toast.error(`${f.name} lebih dari 5 MB.`);
        return false;
      }
      return true;
    });
    setD((p) => ({
      ...p,
      images: [
        ...p.images,
        ...accepted.map((file) => ({
          key: newKey(),
          file,
          preview: URL.createObjectURL(file),
          alt_text: "",
        })),
      ],
    }));
    if (fileRef.current) fileRef.current.value = "";
  };

  const moveImage = (i: number, dir: -1 | 1) =>
    setD((p) => {
      const imgs = [...p.images];
      const j = i + dir;
      if (j < 0 || j >= imgs.length) return p;
      [imgs[i], imgs[j]] = [imgs[j]!, imgs[i]!];
      return { ...p, images: imgs };
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateProductDraft(d);
    if (err) return setError(err);
    setError(null);
    setSaving(true);
    try {
      await saveProduct(d, product ?? undefined);
      toast.success(isEdit ? "Produk diperbarui" : "Produk ditambahkan");
      qc.invalidateQueries({ queryKey: ["admin_products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  const totalStock = d.variants.reduce((s, v) => s + (Number.isFinite(v.stock) ? v.stock : 0), 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100%-1.5rem)] max-w-3xl flex-col gap-0 p-0">
        <div className="border-b border-border px-6 py-5 sm:px-8">
          <DialogTitle className="text-2xl">{isEdit ? "Edit produk" : "Tambah produk"}</DialogTitle>
          <DialogDescription className="mt-1">
            Foto, harga, varian, dan stok tampil langsung di toko setelah disimpan.
          </DialogDescription>
        </div>

        <form
          id="product-form"
          onSubmit={submit}
          className="flex-1 space-y-8 overflow-y-auto px-6 py-6 sm:px-8"
        >
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="pf-name">Nama produk</Label>
              <Input
                id="pf-name"
                className="mt-1.5"
                value={d.name}
                maxLength={160}
                onChange={(e) => {
                  const name = e.target.value;
                  setD((p) => ({ ...p, name, slug: slugTouched ? p.slug : slugify(name) }));
                }}
                placeholder="Vintage Nirvana 'In Utero' Tee (1993)"
              />
            </div>
            <div>
              <Label htmlFor="pf-slug">Slug (alamat produk)</Label>
              <Input
                id="pf-slug"
                className="mt-1.5 font-mono text-xs"
                value={d.slug}
                maxLength={80}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                }}
              />
            </div>
            <div>
              <Label htmlFor="pf-tag">Label (opsional)</Label>
              <Input
                id="pf-tag"
                className="mt-1.5"
                value={d.tag}
                maxLength={40}
                onChange={(e) => set("tag", e.target.value)}
                placeholder="Archive Grail"
              />
            </div>
            <div>
              <Label htmlFor="pf-price">Harga (Rp)</Label>
              <Input
                id="pf-price"
                className="mt-1.5"
                inputMode="numeric"
                value={d.price}
                onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))}
                placeholder="1450000"
              />
              {d.price && (
                <p className="mt-1 text-xs text-muted-foreground">{formatRupiah(d.price)}</p>
              )}
            </div>
            <div className="flex flex-col justify-end gap-3 pb-1">
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Tampilkan di toko</span>
                <Switch checked={d.is_active} onCheckedChange={(v) => set("is_active", v)} />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Produk unggulan</span>
                <Switch checked={d.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
              </label>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="pf-desc">Deskripsi</Label>
              <Textarea
                id="pf-desc"
                className="mt-1.5 min-h-28"
                value={d.description}
                maxLength={3000}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold">Kategori</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada kategori aktif.</p>
              )}
              {categories.map((c) => {
                const on = d.category_ids.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      set(
                        "category_ids",
                        on ? d.category_ids.filter((x) => x !== c.id) : [...d.category_ids, c.id],
                      )
                    }
                    className={cn(
                      "h-9 rounded-full px-4 text-sm transition-colors",
                      on
                        ? "bg-foreground text-background"
                        : "bg-secondary text-foreground hover:bg-accent",
                    )}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Foto</h3>
              <span className="text-xs text-muted-foreground">
                Foto pertama jadi sampul · maks 5 MB
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {d.images.map((img, i) => (
                <div
                  key={img.key}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary"
                >
                  <img
                    src={img.preview}
                    alt={img.alt_text || d.name}
                    className="h-full w-full object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium">
                      Sampul
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label="Hapus foto"
                    onClick={() =>
                      set(
                        "images",
                        d.images.filter((x) => x.key !== img.key),
                      )
                    }
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-foreground hover:bg-background"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute inset-x-2 bottom-2 flex justify-between">
                    <button
                      type="button"
                      aria-label="Geser ke kiri"
                      disabled={i === 0}
                      onClick={() => moveImage(i, -1)}
                      className="grid h-7 w-7 place-items-center rounded-full bg-background/90 disabled:opacity-0"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Geser ke kanan"
                      disabled={i === d.images.length - 1}
                      onClick={() => moveImage(i, 1)}
                      className="grid h-7 w-7 place-items-center rounded-full bg-background/90 disabled:opacity-0"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-foreground/20 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <ImagePlus className="h-5 w-5" /> Tambah
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Varian & stok</h3>
              <span className="text-xs text-muted-foreground">Total stok: {totalStock}</span>
            </div>
            <div className="mt-3 space-y-2">
              {d.variants.length === 0 && (
                <p className="rounded-2xl bg-secondary px-4 py-5 text-center text-sm text-muted-foreground">
                  Belum ada varian.
                </p>
              )}
              {d.variants.map((v) => (
                <div
                  key={v.key}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl bg-secondary p-2.5 sm:grid-cols-[auto_1fr_88px_80px_1fr_auto]"
                >
                  <input
                    type="color"
                    aria-label="Kode warna"
                    value={v.color_hex}
                    onChange={(e) => setVariant(v.key, { color_hex: e.target.value })}
                    className="h-9 w-9 cursor-pointer rounded-full border border-border bg-transparent p-0.5"
                  />
                  <Input
                    aria-label="Nama warna"
                    placeholder="Warna (mis. Hitam)"
                    value={v.color_name}
                    maxLength={40}
                    className="h-9 bg-background"
                    onChange={(e) => {
                      const color_name = e.target.value;
                      setVariant(v.key, {
                        color_name,
                        ...(v.id ? {} : { sku: makeSku(d.slug, color_name, v.size) }),
                      });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Hapus varian"
                    className="sm:order-last"
                    onClick={() =>
                      set(
                        "variants",
                        d.variants.filter((x) => x.key !== v.key),
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                  <Select
                    value={v.size}
                    onValueChange={(size) =>
                      setVariant(v.key, {
                        size,
                        ...(v.id ? {} : { sku: makeSku(d.slug, v.color_name, size) }),
                      })
                    }
                  >
                    <SelectTrigger className="h-9 rounded-full bg-background" aria-label="Ukuran">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {SIZES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    aria-label="Stok"
                    inputMode="numeric"
                    value={String(v.stock)}
                    className="h-9 bg-background"
                    onChange={(e) =>
                      setVariant(v.key, { stock: Number(e.target.value.replace(/\D/g, "") || 0) })
                    }
                  />
                  <Input
                    aria-label="SKU"
                    placeholder="SKU"
                    value={v.sku}
                    maxLength={60}
                    className="col-span-3 h-9 bg-background font-mono text-xs sm:col-span-1"
                    onChange={(e) => setVariant(v.key, { sku: e.target.value.toUpperCase() })}
                  />
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus /> Tambah varian
              </Button>
            </div>
          </section>
        </form>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4 sm:px-8">
          {error && (
            <p role="alert" className="mr-auto text-sm text-destructive">
              {error}
            </p>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button type="submit" form="product-form" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}{" "}
            {isEdit ? "Simpan perubahan" : "Tambah produk"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
