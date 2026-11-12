import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/queries";

type AuthValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  profile: { id: string; full_name: string | null; phone: string | null; role: string } | null | undefined;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setLoading(false);
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      }
      if (event === "SIGNED_OUT") {
        queryClient.removeQueries({ queryKey: ["profile"] });
        queryClient.removeQueries({ queryKey: ["wishlist"] });
        queryClient.removeQueries({ queryKey: ["my_orders"] });
        queryClient.removeQueries({ queryKey: ["admin_stats"] });
        queryClient.removeQueries({ queryKey: ["admin_orders"] });
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const user = session?.user ?? null;
  const { data: profile } = useQuery(profileQuery(user?.id));

  const value: AuthValue = {
    session,
    user,
    loading,
    profile,
    isAdmin: profile?.role === "admin",
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
