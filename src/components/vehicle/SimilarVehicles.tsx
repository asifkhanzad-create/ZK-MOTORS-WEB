import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { VehicleCard } from "@/components/ui/VehicleCard";
import type { Vehicle } from "@/types/vehicle";

/**
 * "Similar cars in stock" section for the vehicle detail page.
 *
 * Renders nothing when there is nothing to show. A heading over an empty grid
 * is worse than no section at all, and with a small inventory that case is
 * reachable rather than theoretical.
 *
 * Carries `id="similar"` so the sold-car panel can send people straight here
 * instead of making them scroll and hunt.
 */
export function SimilarVehicles({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) return null;

  return (
    <section
      id="similar"
      aria-labelledby="similar-heading"
      className="border-t border-ink-800 bg-ink-950 py-16 sm:py-20"
    >
      <Container>
        <SectionHeading
          as="h2"
          eyebrow="Still looking?"
          title={<span id="similar-heading">Similar cars in stock</span>}
          description="Other cars currently with us that a buyer looking at this one would usually want to see."
        />

        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <li key={vehicle.id}>
              <VehicleCard vehicle={vehicle} />
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <Button href="/cars" variant="outline" size="lg">
            See all cars in stock
          </Button>
        </div>
      </Container>
    </section>
  );
}
