import { Reveal } from "./Reveal";

export function Statement() {
  return (
    <section className="bg-ink py-28 text-center sm:py-40">
      <div className="mx-auto max-w-[900px] px-6">
        <Reveal>
          <p className="mb-5 text-sm font-medium text-ink-link">Filosofi PreaseStudios</p>
          <h2 className="text-headline text-ink-foreground">
            Dibuat untuk Bertahan.
            <br />
            <span className="text-ink-muted">Didesain untuk Melampaui Tren.</span>
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-ink-muted">
            Setiap potong telah melewati puluhan tahun dan tetap berdiri. Kami merawat, membersihkan, dan
            memeriksanya dengan teliti agar siap menemani cerita Anda berikutnya.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
