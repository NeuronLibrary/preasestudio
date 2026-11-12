import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";

export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=2000&q=80";
const LIGHT_BANNER =
  "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80";
const DARK_BANNER =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80";

export function Hero() {
  return (
    <section id="home" className="pt-12">
      <div className="mx-auto max-w-[1080px] px-6 pb-12 pt-20 text-center sm:pt-28">
        <Reveal>
          <p className="mb-4 text-sm font-medium text-primary">Koleksi Vintage Terkurasi</p>
          <h1 className="text-display text-foreground">
            PreaseStudios.
            <br />
            <span className="text-muted-foreground">Wear the future.</span>
          </h1>
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
            Kaos band, anime, dan arsip langka dari era 90-an. Dipilih satu per satu, siap dipakai hari ini.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/" hash="shop">Belanja Sekarang</Link>
            </Button>
            <Link to="/" hash="about" className="inline-flex items-center text-base text-primary hover:underline">
              Tentang kami <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>

      <Reveal delay={200} className="mx-auto max-w-[1280px] px-3 sm:px-6">
        <div className="overflow-hidden rounded-card bg-secondary">
          <img
            src={HERO_IMAGE}
            alt="Deretan kaos vintage tergantung rapi di rak"
            className="aspect-[16/9] w-full object-cover sm:aspect-[21/9]"
            fetchPriority="high"
          />
        </div>
      </Reveal>

      <div className="mx-auto mt-3 grid max-w-[1280px] gap-3 px-3 sm:px-6 md:grid-cols-2">
        <Reveal className="group relative flex min-h-[460px] flex-col items-center overflow-hidden rounded-card bg-secondary px-8 pt-12 text-center">
          <h2 className="text-3xl text-foreground sm:text-4xl">Arsip Vintage.</h2>
          <p className="mt-2 text-lg text-muted-foreground">Dari panggung 90-an ke lemari Anda.</p>
          <Button asChild variant="default" className="mt-5">
            <Link to="/" hash="shop">Lihat Koleksi</Link>
          </Button>
          <img
            src={LIGHT_BANNER}
            alt="Koleksi pakaian vintage bernuansa netral"
            loading="lazy"
            className="mt-8 h-64 w-full rounded-t-2xl object-cover transition-transform duration-700 ease-apple group-hover:scale-[1.03]"
          />
        </Reveal>
        <Reveal delay={120} className="group relative flex min-h-[460px] flex-col items-center overflow-hidden rounded-card bg-ink px-8 pt-12 text-center">
          <h2 className="text-3xl text-ink-foreground sm:text-4xl">Edisi Langka.</h2>
          <p className="mt-2 text-lg text-ink-muted">Satu potong, satu cerita. Tidak diproduksi ulang.</p>
          <Button asChild variant="outline-inverse" className="mt-5">
            <Link to="/" hash="shop">Temukan Grail Anda</Link>
          </Button>
          <img
            src={DARK_BANNER}
            alt="Interior toko vintage dengan rak pakaian"
            loading="lazy"
            className="mt-8 h-64 w-full rounded-t-2xl object-cover opacity-80 transition-transform duration-700 ease-apple group-hover:scale-[1.03]"
          />
        </Reveal>
      </div>
    </section>
  );
}
