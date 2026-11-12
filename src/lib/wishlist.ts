import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useUI } from "@/lib/ui";
import { wishlistQuery } from "@/lib/queries";
import { friendlyError } from "@/lib/format";

export function useWishlist() {
  const { user } = useAuth();
  const ui = useUI();
  const qc = useQueryClient();
  const opts = wishlistQuery(user?.id);
  const { data } = useQuery(opts);

  const mutation = useMutation({
    mutationFn: async ({ productId, on }: { productId: number; on: boolean }) => {
      if (!user) throw new Error("Silakan login terlebih dahulu");
      if (on) {
        const { error } = await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
        if (error) throw error;
      }
    },
    onMutate: async ({ productId, on }) => {
      await qc.cancelQueries({ queryKey: opts.queryKey });
      const prev = qc.getQueryData<Set<number>>(opts.queryKey);
      const next = new Set(prev ?? []);
      if (on) next.add(productId);
      else next.delete(productId);
      qc.setQueryData(opts.queryKey, next);
      return { prev };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(opts.queryKey, ctx.prev);
      toast.error(friendlyError(err));
    },
    onSuccess: (_d, { on }) => {
      toast.success(on ? "Ditambahkan ke wishlist" : "Dihapus dari wishlist");
    },
  });

  return {
    has: (id: number) => !!data?.has(id),
    toggle: (id: number) => {
      if (!user) {
        ui.openAuth("login", () => mutation.mutate({ productId: id, on: true }));
        toast("Masuk untuk menyimpan wishlist");
        return;
      }
      mutation.mutate({ productId: id, on: !data?.has(id) });
    },
  };
}
