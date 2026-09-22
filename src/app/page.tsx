import { FeaturedCars } from "@/components/home/FeaturedCars";
import { Hero } from "@/components/home/Hero";
import { LocationContact } from "@/components/home/LocationContact";
import { ProcessSteps } from "@/components/home/ProcessSteps";
import { QuickSearch } from "@/components/home/QuickSearch";
import { RecentlySold } from "@/components/home/RecentlySold";
import { SellExchange } from "@/components/home/SellExchange";
import { Testimonials } from "@/components/home/Testimonials";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";

/**
 * Homepage.
 *
 * Section order alternates dark and light surfaces so the page never becomes a
 * single unbroken dark scroll, while the dark foundation stays dominant.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <QuickSearch />
      <FeaturedCars />
      <WhyChooseUs />
      <SellExchange />
      <ProcessSteps />
      <RecentlySold />
      <Testimonials />
      <LocationContact />
    </>
  );
}
