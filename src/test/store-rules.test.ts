import { describe, expect, it } from "vitest";
import { filterAndSortProducts } from "@/lib/shop";
import { clampQuantity } from "@/lib/cart";
import { formatRupiah } from "@/lib/format";
import { validateRecipient } from "@/components/store/CheckoutDialog";

const products = [
  {
    id: 1,
    name: "A Tee",
    price: 2000000,
    rating_avg: 4.9,
    review_count: 10,
    product_categories: [{ category_id: 1 }],
  },
  {
    id: 2,
    name: "B Long",
    price: 1000000,
    rating_avg: 5.0,
    review_count: 50,
    product_categories: [{ category_id: 2 }],
  },
  {
    id: 3,
    name: "C Tee",
    price: 3000000,
    rating_avg: 4.5,
    review_count: 30,
    product_categories: [{ category_id: 1 }],
  },
];

describe("shop sorting & filtering", () => {
  it("populer sorts by review_count desc", () => {
    expect(
      filterAndSortProducts(products, { categoryId: null, search: "", sort: "populer" }).map(
        (p) => p.id,
      ),
    ).toEqual([2, 3, 1]);
  });
  it("harga naik / turun", () => {
    expect(
      filterAndSortProducts(products, { categoryId: null, search: "", sort: "harga-naik" }).map(
        (p) => p.id,
      ),
    ).toEqual([2, 1, 3]);
    expect(
      filterAndSortProducts(products, { categoryId: null, search: "", sort: "harga-turun" }).map(
        (p) => p.id,
      ),
    ).toEqual([3, 1, 2]);
  });
  it("rating sorts by rating_avg desc", () => {
    expect(
      filterAndSortProducts(products, { categoryId: null, search: "", sort: "rating" }).map(
        (p) => p.id,
      ),
    ).toEqual([2, 1, 3]);
  });
  it("filters by category and search", () => {
    expect(
      filterAndSortProducts(products, { categoryId: 1, search: "c", sort: "populer" }).map(
        (p) => p.id,
      ),
    ).toEqual([3]);
  });
});

describe("cart quantity never exceeds stock", () => {
  it("caps at remaining stock", () => {
    expect(clampQuantity(5, 3, 0)).toBe(3);
    expect(clampQuantity(2, 3, 2)).toBe(1);
    expect(clampQuantity(1, 2, 2)).toBe(0);
  });
});

describe("price format", () => {
  it("formats like Rp 1.450.000", () => {
    expect(formatRupiah(1450000)).toBe("Rp 1.450.000");
  });
});

describe("checkout recipient validation", () => {
  const ok = {
    name: "Budi",
    whatsapp: "081234567890",
    email: "b@x.id",
    address: "Jl. Merdeka No. 10",
    city: "Bandung",
    province: "Jawa Barat",
    postal: "40115",
  };
  it("accepts valid data", () => expect(validateRecipient(ok)).toBeNull());
  it("rejects 4-digit postal code", () =>
    expect(validateRecipient({ ...ok, postal: "4011" })).not.toBeNull());
});

import {
  diffRows,
  makeSku,
  slugify,
  validateProductDraft,
  type ProductDraft,
} from "@/lib/product-form";

const draft = (over: Partial<ProductDraft> = {}): ProductDraft => ({
  name: "Vintage Nirvana Tee",
  slug: "vintage-nirvana-tee",
  tag: "",
  description: "",
  price: "1450000",
  is_active: true,
  is_featured: false,
  category_ids: [],
  images: [{ key: "i1", preview: "x", alt_text: "", image_path: "a.jpg" }],
  variants: [
    {
      key: "v1",
      color_name: "Hitam",
      color_hex: "#000000",
      size: "L",
      stock: 1,
      sku: "VNT-HITAM-L",
    },
  ],
  ...over,
});

describe("admin product form rules", () => {
  it("slugify makes url-safe slugs", () => {
    expect(slugify("Vintage Ozzy 'The Ultimate Sin' (1986)!")).toBe(
      "vintage-ozzy-the-ultimate-sin-1986",
    );
  });
  it("sku is uppercase from slug, color and size", () => {
    expect(makeSku("vintage-nirvana-in-utero", "Hitam Pudar", "XL")).toBe(
      "VINTAGE-NIRVANA-IN-HITAMP-XL",
    );
  });
  it("accepts a complete product", () => {
    expect(validateProductDraft(draft())).toBeNull();
  });
  it("requires at least one photo and one variant", () => {
    expect(validateProductDraft(draft({ images: [] }))).toMatch(/foto/);
    expect(validateProductDraft(draft({ variants: [] }))).toMatch(/varian/);
  });
  it("rejects negative or non-integer price and stock", () => {
    expect(validateProductDraft(draft({ price: "-5" }))).toMatch(/Harga/);
    expect(validateProductDraft(draft({ price: "" }))).toMatch(/Harga/);
    const v = draft().variants[0]!;
    expect(validateProductDraft(draft({ variants: [{ ...v, stock: -1 }] }))).toMatch(/Stok/);
  });
  it("only allows sizes XS–XXL", () => {
    const v = draft().variants[0]!;
    expect(validateProductDraft(draft({ variants: [{ ...v, size: "XXXL" }] }))).toMatch(/Ukuran/);
  });
  it("rejects duplicate color+size and duplicate SKU", () => {
    const v = draft().variants[0]!;
    expect(
      validateProductDraft(draft({ variants: [v, { ...v, key: "v2", sku: "OTHER" }] })),
    ).toMatch(/ganda/);
    expect(validateProductDraft(draft({ variants: [v, { ...v, key: "v2", size: "M" }] }))).toMatch(
      /SKU/,
    );
  });
  it("diffRows splits delete / update / insert", () => {
    const res = diffRows<{ id?: number; n: string }>([1, 2, 3], [{ id: 2, n: "a" }, { n: "b" }]);
    expect(res.toDelete).toEqual([1, 3]);
    expect(res.toUpdate).toEqual([{ id: 2, n: "a" }]);
    expect(res.toInsert).toEqual([{ n: "b" }]);
  });
});
