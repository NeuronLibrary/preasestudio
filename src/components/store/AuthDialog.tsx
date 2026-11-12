import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/format";
import { useUI } from "@/lib/ui";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

export function AuthDialog() {
  const ui = useUI();
  const [mode, setMode] = useState(ui.authMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (ui.authOpen) {
      setMode(ui.authMode);
      setError(null);
      setNotice(null);
    }
  }, [ui.authOpen, ui.authMode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (mode === "register" && fullName.trim().length < 2) return setError("Nama lengkap wajib diisi.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Format email tidak valid.");
    if (password.length < 6) return setError("Kata sandi minimal 6 karakter.");
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success("Berhasil masuk. Selamat datang kembali!");
        setPassword("");
        ui.closeAuth(true);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Akun berhasil dibuat!");
          setPassword("");
          ui.closeAuth(true);
        } else {
          setNotice("Akun dibuat. Cek email Anda untuk konfirmasi, lalu masuk.");
          setMode("login");
        }
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={ui.authOpen} onOpenChange={(o) => !o && ui.closeAuth(false)}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-md p-8">
        <div className="flex flex-col items-center text-center">
          <Logo showText={false} />
          <DialogTitle className="mt-4 text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Masuk ke PreaseStudios" : "Buat akun baru"}
          </DialogTitle>
          <DialogDescription className="mt-1">
            {mode === "login" ? "Untuk checkout, wishlist, dan riwayat pesanan." : "Daftar dalam hitungan detik."}
          </DialogDescription>
        </div>

        <div className="mt-6 grid grid-cols-2 rounded-full bg-secondary p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={cn("h-9 rounded-full text-sm font-medium transition", mode === m ? "bg-background shadow-card" : "text-muted-foreground")}
            >
              {m === "login" ? "Masuk" : "Daftar"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="a-name">Nama lengkap</Label>
              <Input id="a-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" maxLength={80} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="a-email">Email</Label>
            <Input id="a-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-pass">Kata sandi</Label>
            <Input id="a-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </div>
          {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          {notice && <p className="rounded-xl bg-success/10 px-3 py-2 text-sm text-success">{notice}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {mode === "login" ? "Masuk" : "Daftar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
