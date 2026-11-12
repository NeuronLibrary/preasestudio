import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/queries";
import { Reveal } from "./Reveal";
import { ErrorState } from "./StateViews";

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const start = performance.now();
      const dur = 1600;
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / dur);
        setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);
  return (
    <span ref={ref}>
      {n.toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}

export function About() {
  const { data: s, isPending, isError, error, refetch } = useQuery(settingsQuery);
  const stats = s
    ? [
        { value: s.stat_collections ?? 0, suffix: "+", label: "Koleksi Terkurasi" },
        { value: s.stat_cities ?? 0, suffix: "+", label: "Kota Terjangkau" },
        { value: s.stat_satisfaction ?? 0, suffix: "%", label: "Pelanggan Puas" },
        { value: s.stat_exchange_days ?? 0, suffix: " Hari", label: "Garansi Tukar" },
      ]
    : [];

  return (
    <section id="about" className="bg-background py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1180px] gap-16 px-5 sm:px-6 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <p className="mb-4 text-sm font-medium text-primary">About</p>
          <h2 className="text-headline text-foreground">Vintage, dengan standar hari ini.</h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {s?.store_name ?? "PreaseStudios"} lahir dari kecintaan pada kaos band, anime, dan budaya pop era 90-an.
            Kami berburu potongan asli, memeriksa setiap jahitan dan sablon, lalu menghadirkannya dengan pengalaman
            belanja yang rapi dan tepercaya.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {s?.tagline ? `“${s.tagline}.” ` : ""}Masa lalu yang terawat adalah gaya untuk masa depan.
          </p>
        </Reveal>

        {isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {isPending
              ? [1, 2, 3, 4].map((i) => <div key={i} className="h-40 animate-pulse rounded-card bg-secondary" />)
              : stats.map((st, i) => (
                  <Reveal key={st.label} delay={i * 90} className="rounded-card bg-secondary p-6 sm:p-8">
                    <p className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                      <CountUp value={st.value} suffix={st.suffix} />
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{st.label}</p>
                  </Reveal>
                ))}
          </div>
        )}
      </div>
    </section>
  );
}
