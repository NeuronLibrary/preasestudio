import { createFileRoute } from "@tanstack/react-router";
import { Hero, HERO_IMAGE } from "@/components/store/Hero";
import { Shop } from "@/components/store/Shop";
import { Statement } from "@/components/store/Statement";
import { Features } from "@/components/store/Features";
import { About } from "@/components/store/About";
import { Contact } from "@/components/store/Contact";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PreaseStudios — Wear the future. Fashion Vintage Terkurasi" },
      {
        name: "description",
        content: "Belanja kaos band, anime, dan arsip vintage langka era 90-an. Bebas ongkir nasional, garansi tukar 7 hari.",
      },
      { property: "og:title", content: "PreaseStudios — Wear the future." },
      { property: "og:description", content: "Fashion vintage terkurasi: kaos band, anime, dan arsip langka era 90-an." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: HERO_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: HERO_IMAGE },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <Shop />
      <Statement />
      <Features />
      <About />
      <Contact />
    </>
  );
}
