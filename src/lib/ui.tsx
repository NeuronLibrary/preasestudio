import { createContext, useContext, useState, type ReactNode } from "react";
import type { Product } from "@/lib/queries";

type AuthMode = "login" | "register";
type UIValue = {
  product: Product | null;
  openProduct: (p: Product | null) => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  authOpen: boolean;
  authMode: AuthMode;
  openAuth: (mode?: AuthMode, after?: () => void) => void;
  closeAuth: (success: boolean) => void;
  checkoutOpen: boolean;
  setCheckoutOpen: (v: boolean) => void;
  invoiceId: string | null;
  openInvoice: (id: string | null) => void;
  search: string;
  setSearch: (v: string) => void;
};

const UIContext = createContext<UIValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [product, openProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [afterAuth, setAfterAuth] = useState<(() => void) | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [invoiceId, openInvoice] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const value: UIValue = {
    product,
    openProduct,
    cartOpen,
    setCartOpen,
    authOpen,
    authMode,
    openAuth: (mode = "login", after) => {
      setAuthMode(mode);
      setAfterAuth(() => after ?? null);
      setAuthOpen(true);
    },
    closeAuth: (success) => {
      setAuthOpen(false);
      if (success && afterAuth) afterAuth();
      setAfterAuth(null);
    },
    checkoutOpen,
    setCheckoutOpen,
    invoiceId,
    openInvoice,
    search,
    setSearch,
  };
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
