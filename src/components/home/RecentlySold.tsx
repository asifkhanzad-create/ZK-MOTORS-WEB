import { MessageCircle } from "lucide-react";

import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SoldVehicleCard } from "@/components/ui/SoldVehicleCard";
import { getRecentlySoldVehicles } from "@/data/vehicles";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function RecentlySold() {
  const sold = getRecentlySoldVehicles(4);
  const whatsappUrl = buildWhatsAppUrl(
    "Hello ZK Motors, I saw a sold car on your website. Can you let me know when something similar is available?",
  );

  return (
    <section className="border-b border-ink-800 bg-ink-950 py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Recently sold"
          title="Cars that have already found a home"
          description="A snapshot of vehicles sold through ZK Motors. These are shown for reference only — they are no longer available."
        />

        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sold.map((vehicle, index) => (
            <li key={vehicle.id}>
              <Reveal delay={(index % 4) * 60} className="h-full">
                <SoldVehicleCard vehicle={vehicle} />
              </Reveal>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col items-start gap-4 rounded-card border border-ink-800 bg-ink-900 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.9375rem] text-muted-dark">
            Looking for something similar?{" "}
            <span className="text-bone-100">
              Tell us what you need and we will keep an eye out.
            </span>
          </p>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({
                variant: "whatsapp",
                size: "md",
                className: "shrink-0",
              })}
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              Send your requirement
            </a>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
