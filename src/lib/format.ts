import { supabase } from "@/integrations/supabase/client";

export function formatRupiah(value: number | string | null | undefined): string {
  const n = Math.round(Number(value ?? 0));
  return "Rp " + n.toLocaleString("id-ID").replace(/,/g, ".");
}

export function publicUrl(bucket: "product-images" | "site-assets", path?: string | null): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export const productImage = (path?: string | null) => publicUrl("product-images", path);
export const siteAsset = (path: string) => publicUrl("site-assets", path);

export function waLink(number: string | null | undefined, text: string): string {
  const digits = (number ?? "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function formatDate(iso: string, withTime = true): string {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Jakarta",
  });
}

export function friendlyError(err: unknown): string {
  if (!err) return "Terjadi kesalahan. Silakan coba lagi.";
  const msg =
    typeof err === "string"
      ? err
      : typeof err === "object" && err && "message" in err
        ? String((err as { message: unknown }).message)
        : "";
  if (!msg) return "Terjadi kesalahan. Silakan coba lagi.";
  if (/Failed to fetch|NetworkError/i.test(msg)) return "Koneksi bermasalah. Periksa internet Anda lalu coba lagi.";
  if (/Invalid login credentials/i.test(msg)) return "Email atau kata sandi salah.";
  if (/User already registered/i.test(msg)) return "Email ini sudah terdaftar. Silakan masuk.";
  if (/Email not confirmed/i.test(msg)) return "Email belum dikonfirmasi. Cek kotak masuk Anda.";
  if (/Password should be at least/i.test(msg)) return "Kata sandi minimal 6 karakter.";
  if (/products_slug_key/i.test(msg)) return "Slug sudah dipakai produk lain. Ganti slug-nya.";
  if (/product_variants_sku_key/i.test(msg)) return "SKU sudah dipakai produk lain. Ganti SKU-nya.";
  if (/product_variants_product_id_color_name_size_key/i.test(msg)) return "Ada varian dengan warna & ukuran yang sama.";
  if (/row-level security|permission denied/i.test(msg)) return "Akses ditolak. Pastikan akun Anda admin.";
  return msg;
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  dikemas: "Dikemas",
  dikirim: "Dikirim",
  tiba: "Tiba",
};
export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  menunggu_verifikasi: "Menunggu Verifikasi",
  terverifikasi: "Terverifikasi",
};
