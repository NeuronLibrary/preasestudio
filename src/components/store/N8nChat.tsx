import { useEffect } from "react";

const N8N_CHAT_BUNDLE = "https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js";
const N8N_WEBHOOK_URL = "https://n8n-08w77kqelbkp.eu7.sumopod.my.id/webhook/boi-chat-trigger/chat";

let started = false;

/** Loads the n8n chat bubble once, in the browser only. */
export function N8nChat() {
  useEffect(() => {
    if (started) return;
    started = true;
    import(/* @vite-ignore */ N8N_CHAT_BUNDLE)
      .then(({ createChat }) => {
        createChat({
          webhookUrl: N8N_WEBHOOK_URL,
          defaultLanguage: "en",
          initialMessages: ["Halo! 👋", "Ada yang bisa kami bantu hari ini?"],
          i18n: {
            en: {
              title: "Halo! 👋",
              subtitle: "Tanya apa saja seputar produk PreaseStudios.",
              footer: "",
              getStarted: "Mulai percakapan",
              inputPlaceholder: "Tulis pertanyaan Anda…",
              closeButtonTooltip: "Tutup",
            },
          },
        });
      })
      .catch((err) => {
        started = false;
        console.error("Gagal memuat chat", err);
      });
  }, []);
  return null;
}
