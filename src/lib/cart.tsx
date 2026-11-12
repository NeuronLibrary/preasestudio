import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/format";

export type CartItem = {
  variant_id: number;
  product_id: number;
  name: string;
  color_name: string;
  size: string;
  price: number;
  image_path: string | null;
  stock: number;
  quantity: number;
};

export type VoucherState = {
  code: string;
  valid: boolean;
  message: string;
  discount_percent: number;
  discount_amount: number;
} | null;

type CartValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, qty: number) => { added: number; capped: boolean };
  setQuantity: (variantId: number, qty: number) => void;
  remove: (variantId: number) => void;
  clear: () => void;
  voucher: VoucherState;
  voucherLoading: boolean;
  applyVoucher: (code: string) => Promise<void>;
  removeVoucher: () => void;
  discount: number;
};

const STORAGE_KEY = "preasestudios-cart";
const CartContext = createContext<CartValue | null>(null);

export function clampQuantity(requested: number, stock: number, alreadyInCart = 0): number {
  const room = Math.max(0, stock - alreadyInCart);
  return Math.max(0, Math.min(Math.floor(requested), room));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const hydrated = useRef(false);
  const [voucher, setVoucher] = useState<VoucherState>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore corrupt cart */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  const add: CartValue["add"] = useCallback(
    (item, qty) => {
      const existing = items.find((i) => i.variant_id === item.variant_id);
      const added = clampQuantity(qty, item.stock, existing?.quantity ?? 0);
      if (added > 0) {
        setItems((prev) => {
          const found = prev.find((i) => i.variant_id === item.variant_id);
          if (found) {
            return prev.map((i) =>
              i.variant_id === item.variant_id ? { ...i, ...item, quantity: i.quantity + added } : i,
            );
          }
          return [...prev, { ...item, quantity: added }];
        });
      }
      return { added, capped: added < qty };
    },
    [items],
  );

  const setQuantity = useCallback((variantId: number, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.variant_id === variantId ? { ...i, quantity: Math.min(Math.max(1, qty), i.stock) } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const remove = useCallback((variantId: number) => {
    setItems((prev) => prev.filter((i) => i.variant_id !== variantId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setVoucher(null);
  }, []);

  const validate = useCallback(async (code: string, amount: number) => {
    setVoucherLoading(true);
    try {
      const { data, error } = await supabase.rpc("validate_voucher", { p_code: code, p_subtotal: amount });
      if (error) throw error;
      const row = data?.[0];
      setVoucher({
        code: code.trim().toUpperCase(),
        valid: !!row?.valid,
        message: row?.message ?? "Kode voucher tidak valid",
        discount_percent: row?.discount_percent ?? 0,
        discount_amount: Number(row?.discount_amount ?? 0),
      });
    } catch (e) {
      setVoucher({ code: code.trim().toUpperCase(), valid: false, message: friendlyError(e), discount_percent: 0, discount_amount: 0 });
    } finally {
      setVoucherLoading(false);
    }
  }, []);

  // Re-validate when the subtotal changes so the discount stays correct.
  const lastValidated = useRef<number | null>(null);
  useEffect(() => {
    if (!voucher || lastValidated.current === subtotal) return;
    lastValidated.current = subtotal;
    if (subtotal === 0) {
      setVoucher(null);
      return;
    }
    void validate(voucher.code, subtotal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const applyVoucher = useCallback(
    async (code: string) => {
      if (!code.trim()) return;
      lastValidated.current = subtotal;
      await validate(code, subtotal);
    },
    [subtotal, validate],
  );

  const value: CartValue = {
    items,
    count,
    subtotal,
    add,
    setQuantity,
    remove,
    clear,
    voucher,
    voucherLoading,
    applyVoucher,
    removeVoucher: () => setVoucher(null),
    discount: voucher?.valid ? voucher.discount_amount : 0,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
