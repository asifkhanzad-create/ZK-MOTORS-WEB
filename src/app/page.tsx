import { FeaturedCars } from "@/components/home/FeaturedCars";
import { Hero } from "@/components/home/Hero";
import { LocationContact } from "@/components/home/LocationContact";
import { ProcessSteps } from "@/components/home/ProcessSteps";
import { QuickSearch } from "@/components/home/QuickSearch";
import { RecentlySold } from "@/components/home/RecentlySold";
import { SellExchange } from "@/components/home/SellExchange";
import { Testimonials } from "@/components/home/Testimonials";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { PageTransition } from "@/components/ui/PageTransition";
import { fetchVehicles } from "@/lib/vehicles-source";

/**
 * The homepage is prerendered and revalidated every five minutes.
 *
 * Without a `revalidate` window the build-time snapshot would be the only one
 * that ever shipped, so a car marked sold in the database would stay on the
 * homepage until someone deployed again. `revalidatePath()` from the Phase 6
 * admin dashboard makes an edit appear immediately; this is the backstop for
 * changes made directly in Supabase.
 */
export const revalidate = 300;

/**
 * Homepage.
 *
 * Section order alternates dark and light surfaces so the page never becomes a
 * single unbroken dark scroll, while the dark foundation stays dominant.
 *
 * The inventory is fetched **once** here and handed to the three sections that
 * need it, rather than each fetching for itself. `fetchVehicles` is memoised
 * per request, but passing the list makes the single read explicit — and it
 * keeps the three sections presentational, so they stay easy to reason about.
 */
export default async function HomePage() {
  const vehicles = await fetchVehicles();

  return (
    <PageTransition>
      <Hero />
      <QuickSearch vehicles={vehicles} />
      <FeaturedCars vehicles={vehicles} />
      <WhyChooseUs />
      <SellExchange />
      <ProcessSteps />
      <RecentlySold vehicles={vehicles} />
      <Testimonials />
      <LocationContact />
    </PageTransition>
  );
}
