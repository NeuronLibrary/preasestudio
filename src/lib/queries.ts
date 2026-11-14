import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type StoreSettings = Tables<"store_settings">;
export type OrderDetail = Tables<"orders"> & { order_items: Tables<"order_items">[] };

async function productsFetcher(includeInactive = false) {
  let query = supabase
    .from("products")
    .select(
      "id, slug, name, tag, description, price, rating_avg, review_count, is_featured, is_active, created_at, product_images(id, image_path, alt_text, sort_order), product_variants(id, color_name, color_hex, size, stock, sku), product_categories(category_id)",
    );
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    ...p,
    product_images: [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    product_variants: [...(p.product_variants ?? [])].sort((a, b) => a.id - b.id),
  }));
}

export type Product = Awaited<ReturnType<typeof productsFetcher>>[number];
export type Variant = Product["product_variants"][number];

export const productsQuery = queryOptions({ queryKey: ["products"], queryFn: () => productsFetcher() });

/** Admin list: includes hidden (inactive) products; RLS only returns them to admins. */
export const adminProductsQuery = queryOptions({ queryKey: ["admin_products"], queryFn: () => productsFetcher(true) });

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, sort_order")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const settingsQuery = queryOptions({
  queryKey: ["store_settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60_000,
});

export const shippingQuery = queryOptions({
  queryKey: ["shipping_methods"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("shipping_methods")
      .select("id, name, description, cost")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const paymentQuery = queryOptions({
  queryKey: ["payment_methods"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("id, code, name, description, type, account_number, account_name")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const wishlistQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["wishlist", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("wishlists").select("product_id").eq("user_id", userId!);
      if (error) throw error;
      return new Set((data ?? []).map((w) => w.product_id));
    },
  });

export const profileQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, role, created_at")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const myOrdersQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my_orders", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, invoice_number, total, status, payment_status, created_at, order_items(id)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const orderQuery = (orderId: string | null) =>
  queryOptions({
    queryKey: ["order", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId!)
        .maybeSingle();
      if (error) throw error;
      return data as OrderDetail | null;
    },
  });

export type DashboardStats = {
  total_orders: number;
  total_revenue: number;
  items_sold: number;
  pending_orders: number;
  daily_sales: { date: string; revenue: number }[];
};

export const adminStatsQuery = queryOptions({
  queryKey: ["admin_stats"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("admin_dashboard_stats");
    if (error) throw error;
    return data as unknown as DashboardStats;
  },
});

export const adminOrdersQuery = queryOptions({
  queryKey: ["admin_orders"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, invoice_number, customer_name, customer_whatsapp, city, total, status, payment_status, payment_method_name, shipping_method_name, tracking_number, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  },
});
