import { Leaf, MessageCircle, RefreshCw, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Truck, title: "Bebas Ongkir Nasional", body: "Pengiriman ke seluruh Indonesia, dikemas aman dan rapi." },
  { icon: Leaf, title: "Material Organik Bersertifikasi", body: "Katun pilihan yang lembut di kulit dan ramah lingkungan." },
  { icon: RefreshCw, title: "Garansi Tukar Ukuran 7 Hari", body: "Ukuran kurang pas? Tukar dengan mudah dalam 7 hari." },
  { icon: ShieldCheck, title: "Pembayaran Terverifikasi", body: "Setiap pembayaran dicek manual oleh tim kami sebelum dikirim." },
  { icon: MessageCircle, title: "Konsultasi 24/7 via WhatsApp", body: "Tanya ukuran, kondisi, atau pesanan kapan saja." },
];

export function Features() {
  return (
    <section id="features" className="bg-secondary py-24 sm:py-32">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <Reveal className="mb-12 max-w-2xl">
          <h2 className="text-headline text-foreground">
            Features. <span className="text-muted-foreground">Belanja vintage tanpa ragu.</span>
          </h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.title}
              delay={i * 80}
              className={cn(
                "flex flex-col rounded-card bg-background p-8 shadow-card",
                i < 2 ? "lg:col-span-3" : "lg:col-span-2",
              )}
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary">
                <f.icon className="h-5 w-5 text-primary" />
              </span>
              <h3 className="mt-6 text-xl text-foreground">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
