export type SortKey = "populer" | "harga-naik" | "harga-turun" | "rating";

type Sortable = {
  id: number;
  name: string;
  description?: string | null;
  tag?: string | null;
  price: number | string;
  rating_avg: number | string;
  review_count: number;
  product_categories: { category_id: number }[];
};

export function filterAndSortProducts<T extends Sortable>(
  products: T[],
  opts: { categoryId: number | null; search: string; sort: SortKey },
): T[] {
  const q = opts.search.trim().toLowerCase();
  const filtered = products.filter((p) => {
    if (opts.categoryId !== null && !p.product_categories.some((c) => c.category_id === opts.categoryId)) return false;
    if (!q) return true;
    return [p.name, p.tag ?? "", p.description ?? ""].some((s) => s.toLowerCase().includes(q));
  });
  const sorted = [...filtered];
  switch (opts.sort) {
    case "populer":
      sorted.sort((a, b) => b.review_count - a.review_count);
      break;
    case "harga-naik":
      sorted.sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case "harga-turun":
      sorted.sort((a, b) => Number(b.price) - Number(a.price));
      break;
    case "rating":
      sorted.sort((a, b) => Number(b.rating_avg) - Number(a.rating_avg) || b.review_count - a.review_count);
      break;
  }
  return sorted;
}
