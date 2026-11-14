import { supabase } from "@/integrations/supabase/client";
import { productImage } from "@/lib/format";
import type { Product } from "@/lib/queries";
import {
  diffRows,
  type ImageDraft,
  type ProductDraft,
  type VariantDraft,
} from "@/lib/product-form";

const BUCKET = "product-images";
let keySeq = 0;
export const newKey = () => `k${Date.now().toString(36)}${(keySeq++).toString(36)}`;

export function emptyDraft(): ProductDraft {
  return {
    name: "",
    slug: "",
    tag: "",
    description: "",
    price: "",
    is_active: true,
    is_featured: false,
    category_ids: [],
    variants: [],
    images: [],
  };
}

export function draftFromProduct(p: Product): ProductDraft {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    tag: p.tag ?? "",
    description: p.description ?? "",
    price: String(Math.round(Number(p.price))),
    is_active: p.is_active,
    is_featured: p.is_featured,
    category_ids: p.product_categories.map((c) => c.category_id),
    variants: p.product_variants.map<VariantDraft>((v) => ({ key: newKey(), ...v })),
    images: p.product_images.map<ImageDraft>((img) => ({
      key: newKey(),
      id: img.id,
      image_path: img.image_path,
      preview: productImage(img.image_path),
      alt_text: img.alt_text ?? "",
    })),
  };
}

function isStoragePath(path?: string | null): path is string {
  return !!path && !/^https?:\/\//.test(path);
}

async function uploadImage(slug: string, file: File, index: number): Promise<string> {
  const ext =
    (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${slug}-${Date.now().toString(36)}-${index}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

async function check<T extends { error: unknown }>(p: PromiseLike<T>): Promise<T> {
  const res = await p;
  if (res.error) throw res.error;
  return res;
}

/** Saves a product with its variants, photos, and categories. `original` is the stored product when editing. */
export async function saveProduct(draft: ProductDraft, original?: Product): Promise<number> {
  // Upload new photos first so a failed upload doesn't leave a half-saved product.
  const uploaded: string[] = [];
  const images = [...draft.images];
  try {
    for (let i = 0; i < images.length; i++) {
      const img = images[i]!;
      if (img.file) {
        const path = await uploadImage(draft.slug, img.file, i);
        uploaded.push(path);
        const { file: _file, ...rest } = img;
        images[i] = { ...rest, image_path: path };
      }
    }
  } catch (e) {
    if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded);
    throw e;
  }

  const row = {
    name: draft.name.trim(),
    slug: draft.slug,
    tag: draft.tag.trim() || null,
    description: draft.description.trim() || null,
    price: Number(draft.price),
    is_active: draft.is_active,
    is_featured: draft.is_featured,
  };

  let productId: number;
  if (draft.id) {
    const { data, error } = await supabase
      .from("products")
      .update(row)
      .eq("id", draft.id)
      .select("id");
    if (error) throw error;
    if (!data?.length) throw new Error("Produk tidak tersimpan. Pastikan akun Anda admin.");
    productId = draft.id;
  } else {
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error) {
      if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded);
      throw error;
    }
    productId = data.id;
  }

  // Variants
  const vDiff = diffRows(original?.product_variants.map((v) => v.id) ?? [], draft.variants);
  if (vDiff.toDelete.length)
    await check(supabase.from("product_variants").delete().in("id", vDiff.toDelete));
  for (const v of vDiff.toUpdate) {
    await check(
      supabase
        .from("product_variants")
        .update({
          color_name: v.color_name.trim(),
          color_hex: v.color_hex,
          size: v.size,
          stock: v.stock,
          sku: v.sku.trim().toUpperCase(),
        })
        .eq("id", v.id!),
    );
  }
  if (vDiff.toInsert.length) {
    await check(
      supabase.from("product_variants").insert(
        vDiff.toInsert.map((v) => ({
          product_id: productId,
          color_name: v.color_name.trim(),
          color_hex: v.color_hex,
          size: v.size,
          stock: v.stock,
          sku: v.sku.trim().toUpperCase(),
        })),
      ),
    );
  }

  // Photos (order in the form = sort_order)
  const originalImages = original?.product_images ?? [];
  const iDiff = diffRows(
    originalImages.map((i) => i.id),
    images,
  );
  if (iDiff.toDelete.length) {
    await check(supabase.from("product_images").delete().in("id", iDiff.toDelete));
    const removedPaths = originalImages
      .filter((i) => iDiff.toDelete.includes(i.id))
      .map((i) => i.image_path)
      .filter(isStoragePath);
    if (removedPaths.length) await supabase.storage.from(BUCKET).remove(removedPaths);
  }
  const altFallback = row.name;
  for (const img of iDiff.toUpdate) {
    await check(
      supabase
        .from("product_images")
        .update({
          sort_order: images.indexOf(img) + 1,
          alt_text: img.alt_text.trim() || altFallback,
        })
        .eq("id", img.id!),
    );
  }
  if (iDiff.toInsert.length) {
    await check(
      supabase.from("product_images").insert(
        iDiff.toInsert.map((img) => ({
          product_id: productId,
          image_path: img.image_path!,
          alt_text: img.alt_text.trim() || altFallback,
          sort_order: images.indexOf(img) + 1,
        })),
      ),
    );
  }

  // Categories
  await check(supabase.from("product_categories").delete().eq("product_id", productId));
  if (draft.category_ids.length) {
    await check(
      supabase
        .from("product_categories")
        .insert(draft.category_ids.map((category_id) => ({ product_id: productId, category_id }))),
    );
  }

  return productId;
}

export async function deleteProduct(p: Product): Promise<void> {
  const { data, error } = await supabase.from("products").delete().eq("id", p.id).select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Produk tidak terhapus. Pastikan akun Anda admin.");
  const paths = p.product_images.map((i) => i.image_path).filter(isStoragePath);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}
