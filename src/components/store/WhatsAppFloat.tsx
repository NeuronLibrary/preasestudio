import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { settingsQuery } from "@/lib/queries";
import { waLink } from "@/lib/format";

export function WhatsAppFloat() {
  const { data: s } = useQuery(settingsQuery);
  if (!s?.whatsapp_number) return null;
  return (
    <a
      href={waLink(s.whatsapp_number, `Halo ${s.store_name}, saya ingin bertanya.`)}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat via WhatsApp"
      className="no-print fixed bottom-[6.5rem] right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-float transition-transform duration-300 ease-apple hover:scale-105"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
