import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { settingsQuery } from "@/lib/queries";
import { waLink } from "@/lib/format";
import { Reveal } from "./Reveal";
import { ErrorState } from "./StateViews";

export function Contact() {
  const { data: s, isPending, isError, error, refetch } = useQuery(settingsQuery);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!s?.whatsapp_number) {
      toast.error("Nomor WhatsApp toko belum tersedia");
      return;
    }
    if (!name.trim() || !message.trim()) {
      toast.error("Nama dan pesan wajib diisi");
      return;
    }
    const text = `Halo ${s.store_name}, saya ${name.trim()}.${topic.trim() ? `\nPerihal: ${topic.trim()}` : ""}\n\n${message.trim()}`;
    window.open(waLink(s.whatsapp_number, text), "_blank", "noopener");
  };

  const info = s
    ? [
        { icon: MessageCircle, label: "WhatsApp", value: `+${s.whatsapp_number}`, href: waLink(s.whatsapp_number, `Halo ${s.store_name}!`) },
        ...(s.email ? [{ icon: Mail, label: "Email", value: s.email, href: `mailto:${s.email}` }] : []),
        ...(s.address ? [{ icon: MapPin, label: "Alamat", value: s.address, href: undefined }] : []),
        ...(s.operating_hours ? [{ icon: Clock, label: "Jam Operasional", value: s.operating_hours, href: undefined }] : []),
      ]
    : [];

  return (
    <section id="contact" className="bg-secondary py-24 sm:py-32">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <Reveal className="mb-12 max-w-2xl">
          <h2 className="text-headline text-foreground">
            Contact. <span className="text-muted-foreground">Kami siap membantu.</span>
          </h2>
        </Reveal>

        {isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-5">
            <Reveal className="flex flex-col gap-4 lg:col-span-2">
              <div className="rounded-card bg-background p-6 shadow-card sm:p-8">
                {isPending ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-10 animate-pulse rounded-xl bg-secondary" />
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-5">
                    {info.map((it) => (
                      <li key={it.label} className="flex gap-4">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary">
                          <it.icon className="h-4 w-4 text-primary" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{it.label}</p>
                          {it.href ? (
                            <a href={it.href} target="_blank" rel="noreferrer" className="break-words text-[15px] font-medium text-foreground hover:text-primary">
                              {it.value}
                            </a>
                          ) : (
                            <p className="break-words text-[15px] font-medium text-foreground">{it.value}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <form onSubmit={submit} className="rounded-card bg-background p-6 shadow-card sm:p-8">
                <h3 className="text-xl text-foreground">Kirim pesan</h3>
                <p className="mt-1 text-sm text-muted-foreground">Pesan Anda akan terbuka di WhatsApp.</p>
                <div className="mt-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="c-name">Nama</Label>
                    <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" maxLength={80} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-topic">Perihal</Label>
                    <Input id="c-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Tanya ukuran, pesanan, dll." maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-msg">Pesan</Label>
                    <Textarea id="c-msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="rounded-xl" maxLength={1000} />
                  </div>
                  <Button type="submit" variant="whatsapp" className="w-full" disabled={isPending}>
                    <Send /> Kirim via WhatsApp
                  </Button>
                </div>
              </form>
            </Reveal>

            <Reveal delay={120} className="min-h-[420px] overflow-hidden rounded-card bg-background shadow-card lg:col-span-3">
              <iframe
                title="Lokasi PreaseStudios di Google Maps"
                src={`https://www.google.com/maps?q=${encodeURIComponent(s?.address || "Bandung, Jawa Barat")}&output=embed`}
                className="h-full min-h-[420px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Reveal>
          </div>
        )}
      </div>
    </section>
  );
}
