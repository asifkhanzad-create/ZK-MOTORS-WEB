"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * Persistent WhatsApp action on small screens only.
 * Appears once the visitor has scrolled past the hero so it never covers the
 * primary hero CTAs, and it is suppressed entirely under reduced-motion.
 */
export function MobileWhatsAppButton() {
  const [visible, setVisible] = useState(false);
  const whatsappUrl = buildWhatsAppUrl();

  useEffect(() => {
    if (!whatsappUrl) return;

    function onScroll() {
      setVisible(window.scrollY > 520);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [whatsappUrl]);

  if (!whatsappUrl) return null;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with ZK Motors on WhatsApp"
      className={cn(
        "fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full",
        "bg-whatsapp text-ink-950 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)]",
        "transition-[opacity,transform] duration-300 ease-out",
        "lg:hidden motion-reduce:transition-none",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <MessageCircle aria-hidden="true" className="size-6" />
    </a>
  );
}
