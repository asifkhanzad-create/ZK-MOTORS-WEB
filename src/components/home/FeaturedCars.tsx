import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { VehicleCard } from "@/components/ui/VehicleCard";
import { getFeaturedVehicles } from "@/data/vehicles";

export function FeaturedCars() {
  const featured = getFeaturedVehicles();

  return (
    <section className="border-b border-ink-800 bg-ink-950 py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Available now"
            title="Featured cars"
            description="A selection from our current stock in Wah Cantt and Taxila. Every listing shows the year, mileage and asking price up front."
          />
          <Button
            href="/cars"
            variant="outline"
            size="md"
            className="hidden shrink-0 sm:inline-flex"
          >
            View all cars
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((vehicle, index) => (
            <li key={vehicle.id}>
              <Reveal delay={(index % 3) * 70} className="h-full">
                <VehicleCard vehicle={vehicle} />
              </Reveal>
            </li>
          ))}
        </ul>

        <div className="mt-10 sm:hidden">
          <Button href="/cars" variant="outline" size="lg" className="w-full">
            View all cars
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </Container>
    </section>
  );
}
