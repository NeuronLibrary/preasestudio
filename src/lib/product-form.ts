export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type VariantDraft = {
  key: string;
  id?: number;
  color_name: string;
  color_hex: string;
  size: string;
  stock: number;
  sku: string;
};
export type ImageDraft = {
  key: string;
  id?: number;
  image_path?: string;
  file?: File;
  preview: string;
  alt_text: string;
};
export type ProductDraft = {
  id?: number;
  name: string;
  slug: string;
  tag: string;
  description: string;
  price: string;
  is_active: boolean;
  is_featured: boolean;
  category_ids: number[];
  variants: VariantDraft[];
  images: ImageDraft[];
};

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function makeSku(slug: string, color: string, size: string): string {
  const base = slugify(slug).split("-").filter(Boolean).slice(0, 3).join("-") || "PRD";
  const c = slugify(color).replace(/-/g, "").slice(0, 6) || "CLR";
  return `${base}-${c}-${size}`.toUpperCase();
}

/** Returns an Indonesian error message, or null when the draft can be saved. */
export function validateProductDraft(d: ProductDraft): string | null {
  if (d.name.trim().length < 3) return "Nama produk minimal 3 karakter.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug))
    return "Slug hanya boleh huruf kecil, angka, dan tanda hubung.";
  const price = Number(d.price);
  if (d.price.trim() === "" || !Number.isInteger(price) || price < 0)
    return "Harga harus berupa angka bulat 0 atau lebih.";
  if (d.images.length === 0) return "Tambahkan minimal 1 foto produk.";
  if (d.variants.length === 0) return "Tambahkan minimal 1 varian (warna & ukuran).";
  const combos = new Set<string>();
  const skus = new Set<string>();
  for (const v of d.variants) {
    if (!v.color_name.trim()) return "Nama warna varian wajib diisi.";
    if (!/^#[0-9a-f]{6}$/i.test(v.color_hex)) return `Kode warna "${v.color_hex}" tidak valid.`;
    if (!(SIZES as readonly string[]).includes(v.size)) return `Ukuran "${v.size}" tidak valid.`;
    if (!Number.isInteger(v.stock) || v.stock < 0) return "Stok harus angka bulat 0 atau lebih.";
    if (!v.sku.trim()) return "SKU varian wajib diisi.";
    const combo = `${v.color_name.trim().toLowerCase()}|${v.size}`;
    if (combos.has(combo)) return `Varian ${v.color_name.trim()} ukuran ${v.size} ganda.`;
    combos.add(combo);
    const sku = v.sku.trim().toUpperCase();
    if (skus.has(sku)) return `SKU ${sku} dipakai lebih dari sekali.`;
    skus.add(sku);
  }
  return null;
}

/** Splits drafts against the ids already stored: which rows to delete, update, or insert. */
export function diffRows<T extends { id?: number }>(existingIds: number[], drafts: T[]) {
  const kept = new Set(drafts.filter((d) => d.id !== undefined).map((d) => d.id!));
  return {
    toDelete: existingIds.filter((id) => !kept.has(id)),
    toUpdate: drafts.filter((d) => d.id !== undefined && existingIds.includes(d.id)),
    toInsert: drafts.filter((d) => d.id === undefined),
  };
}
