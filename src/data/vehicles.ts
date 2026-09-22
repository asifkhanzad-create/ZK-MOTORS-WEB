import type {
  BodyType,
  FuelType,
  Transmission,
  Vehicle,
  VehicleStatus,
} from "@/types/vehicle";

/**
 * ============================================================================
 * SAMPLE INVENTORY — PLACEHOLDER DATA
 * ============================================================================
 * These vehicles are realistic examples for the Wah Cantt / Taxila market, not
 * real stock. Replace this array with live data (Supabase in Phase 5) — the
 * presentation components read only from the exported helpers below.
 *
 * Images in /public/vehicles are free-licence stock photos standing in for
 * ZK Motors' own photography. Swap the files, keeping the same filenames, and
 * update `imageAlt` to describe the real vehicle.
 *
 * `description` is written from the facts in each record — year, trim,
 * mileage, transmission, registration city — plus what the trim level means
 * within that model range. It deliberately makes **no** claims about the
 * condition of an individual car. Do not add "immaculate", "accident-free" or
 * similar to these: nothing on this site has been inspected, and the detail
 * page shows a visible notice saying so.
 *
 * `highlight` is the one field that does carry a condition claim, and it is
 * placeholder text to be replaced with real, verified information.
 */

/** Drives the visible "sample listing" notice on the vehicle detail page.
 *  Set to false once real stock and real copy are in. */
export const inventoryIsPlaceholder = true;

export const vehicles: Vehicle[] = [
  /* ------------------------------ Available ------------------------------ */
  {
    id: "toyota-corolla-altis-grande-2021",
    make: "Toyota",
    model: "Corolla",
    variant: "Altis Grande 1.8",
    year: 2021,
    price: 8_650_000,
    mileage: 42_000,
    transmission: "Automatic",
    fuel: "Petrol",
    bodyType: "Sedan",
    registrationCity: "Islamabad",
    status: "available",
    image: "/vehicles/corolla-altis.jpg",
    imageAlt:
      "Black Toyota Corolla Altis Grande sedan parked outdoors, front three-quarter view",
    highlight: "Single owner, complete service history",
    description:
      "The Altis Grande is the top trim in the Corolla range, and this 2021 car carries the 1.8-litre engine the badge names, paired with an automatic gearbox. It has covered 42,000 km and is registered in Islamabad. A four-door sedan — this is the version of the Corolla that came with the most equipment as standard.",
    featured: true,
  },
  {
    id: "honda-civic-oriel-2022",
    make: "Honda",
    model: "Civic",
    variant: "Oriel",
    year: 2022,
    price: 10_400_000,
    mileage: 31_000,
    transmission: "Automatic",
    fuel: "Petrol",
    bodyType: "Sedan",
    registrationCity: "Rawalpindi",
    status: "available",
    image: "/vehicles/civic-oriel.jpg",
    imageAlt: "Grey Honda Civic sedan parked on a residential street, rear view",
    highlight: "Low mileage, original paint",
    description:
      "Oriel is the highest trim in the Civic range. This 2022 car is automatic and petrol, has covered 31,000 km, and is registered in Rawalpindi. A sedan, and the newest model year currently in stock.",
    featured: true,
  },
  {
    id: "toyota-fortuner-sigma-4-2019",
    make: "Toyota",
    model: "Fortuner",
    variant: "Sigma 4",
    year: 2019,
    price: 16_750_000,
    mileage: 78_000,
    transmission: "Automatic",
    fuel: "Diesel",
    bodyType: "SUV",
    registrationCity: "Islamabad",
    status: "available",
    image: "/vehicles/fortuner-sigma.jpg",
    imageAlt: "Black Toyota Fortuner SUV parked beside trees",
    highlight: "4x4 diesel, well maintained",
    description:
      "The Sigma 4 is the four-wheel-drive Fortuner, and this 2019 car is the diesel. Automatic, 78,000 km, registered in Islamabad. A full-size SUV — this is the model people buy here when the route includes unpaved roads and a loaded vehicle.",
    featured: true,
  },
  {
    id: "toyota-land-cruiser-prado-tx-2017",
    make: "Toyota",
    model: "Land Cruiser Prado",
    variant: "TX",
    year: 2017,
    price: 24_500_000,
    mileage: 96_000,
    transmission: "Automatic",
    fuel: "Petrol",
    bodyType: "SUV",
    registrationCity: "Islamabad",
    status: "available",
    image: "/vehicles/prado-tx.jpg",
    imageAlt: "Black Toyota Land Cruiser Prado SUV on a mountain road at dusk",
    highlight: "Imported, accident-free",
    description:
      "The TX is the higher of the two Prado trims. This 2017 car is petrol and automatic, showing 96,000 km with Islamabad registration. A full-size four-wheel-drive SUV, and the most expensive car currently on the lot.",
    featured: true,
  },
  {
    id: "suzuki-swift-glx-2020",
    make: "Suzuki",
    model: "Swift",
    variant: "GLX CVT",
    year: 2020,
    price: 4_150_000,
    mileage: 55_000,
    transmission: "Automatic",
    fuel: "Petrol",
    bodyType: "Hatchback",
    registrationCity: "Wah Cantt",
    status: "available",
    image: "/vehicles/swift-glx.jpg",
    imageAlt: "Blue Suzuki Swift hatchback parked on a hillside road",
    highlight: "Economical daily driver",
    description:
      "The GLX is the top Swift trim, and this one is the CVT automatic rather than the manual. A 2020 car, petrol, 55,000 km, registered in Wah Cantt. A hatchback — compact, easy to park, and economical on a daily commute.",
    featured: true,
  },
  {
    id: "kia-picanto-2021",
    make: "Kia",
    model: "Picanto",
    variant: "1.0 A/T",
    year: 2021,
    price: 3_650_000,
    mileage: 38_000,
    transmission: "Automatic",
    fuel: "Petrol",
    bodyType: "Hatchback",
    registrationCity: "Rawalpindi",
    status: "reserved",
    image: "/vehicles/kia-picanto.jpg",
    imageAlt: "White Kia Picanto hatchback parked on a paved surface, front view",
    highlight: "Ideal first car, low running cost",
    description:
      "The Picanto is the smallest car we keep, and it is a city hatchback rather than a long-distance car. This 2021 example is the 1.0-litre automatic, petrol, with 38,000 km and Rawalpindi registration. Currently reserved — message us and we will tell you if it becomes available again.",
    featured: true,
  },
  {
    id: "suzuki-ciaz-glx-2019",
    make: "Suzuki",
    model: "Ciaz",
    variant: "1.4 GLX",
    year: 2019,
    price: 4_850_000,
    mileage: 62_000,
    transmission: "Automatic",
    fuel: "Petrol",
    bodyType: "Sedan",
    registrationCity: "Islamabad",
    status: "available",
    image: "/vehicles/suzuki-ciaz.jpg",
    imageAlt: "Silver Suzuki Ciaz sedan parked on a street, rear three-quarter view",
    highlight: "Roomy sedan, economical to run",
    description:
      "The Ciaz is the larger of Suzuki's two sedans, and the 1.4 GLX is the top trim. This 2019 car is automatic and petrol, with 62,000 km and Islamabad registration. A sedan with a proper boot — which is the main thing buyers step up from a hatchback for.",
  },
  {
    id: "suzuki-jimny-glx-2021",
    make: "Suzuki",
    model: "Jimny",
    variant: "1.5 GLX",
    year: 2021,
    price: 8_200_000,
    mileage: 28_000,
    transmission: "Automatic",
    fuel: "Petrol",
    bodyType: "SUV",
    registrationCity: "Islamabad",
    status: "available",
    image: "/vehicles/suzuki-jimny.jpg",
    imageAlt: "Yellow Suzuki Jimny compact 4x4 parked on a street, front view",
    highlight: "4x4, imported, low mileage",
    description:
      "The Jimny is a small ladder-frame four-wheel drive — a different proposition from the crossover SUVs it usually gets compared with. This 2021 car is the 1.5 GLX, automatic and petrol, with 28,000 km and Islamabad registration.",
  },
  {
    id: "suzuki-vitara-gl-plus-2018",
    make: "Suzuki",
    model: "Vitara",
    variant: "1.6 GL+",
    year: 2018,
    price: 6_400_000,
    mileage: 71_000,
    transmission: "Automatic",
    fuel: "Petrol",
    bodyType: "SUV",
    registrationCity: "Rawalpindi",
    status: "available",
    image: "/vehicles/suzuki-vitara.jpg",
    imageAlt: "Silver Suzuki Vitara SUV standing in an open field under a cloudy sky",
    highlight: "Imported, well maintained",
    description:
      "The Vitara is Suzuki's compact crossover and GL+ is the higher of its two trims. This 2018 car is the 1.6-litre automatic, petrol, 71,000 km, registered in Rawalpindi. It sits between a hatchback and a full SUV: raised seating position and more space, without the running costs of a large four-wheel drive.",
  },
  {
    id: "suzuki-grand-vitara-2015",
    make: "Suzuki",
    model: "Grand Vitara",
    variant: "2.4",
    year: 2015,
    price: 5_300_000,
    mileage: 118_000,
    transmission: "Manual",
    fuel: "Petrol",
    bodyType: "SUV",
    registrationCity: "Taxila",
    status: "available",
    image: "/vehicles/suzuki-grand-vitara.jpg",
    imageAlt: "Silver Suzuki Grand Vitara SUV with a front bull bar parked in a grassy field",
    highlight: "Genuine 4x4, ready for rough roads",
    description:
      "The Grand Vitara is the older, body-on-frame Suzuki SUV — a proper four-wheel drive rather than a crossover. This 2015 car is the 2.4-litre petrol with a manual gearbox, showing 118,000 km and registered in Taxila. The highest-mileage car on the lot.",
  },

  /* ----------------------------- Recently sold ---------------------------- */
  {
    id: "honda-city-aspire-2019",
    make: "Honda",
    model: "City",
    variant: "1.5 Aspire",
    year: 2019,
    price: 6_150_000,
    mileage: 71_000,
    transmission: "Automatic",
    fuel: "Petrol",
    bodyType: "Sedan",
    registrationCity: "Taxila",
    status: "sold",
    image: "/vehicles/city-aspire.jpg",
    imageAlt: "White Honda City sedan parked outdoors, rear view",
    description:
      "The Aspire is the top trim of the City. This 2019 car was the 1.5-litre automatic, petrol, with 71,000 km and Taxila registration. It has since been sold.",
  },
  {
    id: "hyundai-kona-2019",
    make: "Hyundai",
    model: "Kona",
    variant: "FWD",
    year: 2019,
    price: 7_400_000,
    mileage: 44_000,
    transmission: "Automatic",
    fuel: "Petrol",
    bodyType: "Crossover",
    registrationCity: "Islamabad",
    status: "sold",
    image: "/vehicles/hyundai-kona.jpg",
    imageAlt: "Black Hyundai Kona crossover on a road in fog with headlights on",
    description:
      "The Kona is Hyundai's compact crossover. This 2019 front-wheel-drive example was automatic and petrol, with 44,000 km and Islamabad registration. It has since been sold.",
  },
  {
    id: "toyota-hilux-revo-2020",
    make: "Toyota",
    model: "Hilux",
    variant: "Revo G",
    year: 2020,
    price: 12_900_000,
    mileage: 63_000,
    transmission: "Manual",
    fuel: "Diesel",
    bodyType: "Pickup",
    registrationCity: "Attock",
    status: "sold",
    image: "/vehicles/hilux-revo.jpg",
    imageAlt: "Silver Toyota Hilux double-cab pickup parked on a tree-lined street",
    description:
      "The Revo G is the double-cab Hilux in the higher trim. This 2020 car was the diesel with a manual gearbox, 63,000 km, registered in Attock. It has since been sold.",
  },
  {
    id: "bmw-x3-xdrive30i-2018",
    make: "BMW",
    model: "X3",
    variant: "xDrive30i",
    year: 2018,
    price: 18_900_000,
    mileage: 52_000,
    transmission: "Automatic",
    fuel: "Petrol",
    bodyType: "SUV",
    registrationCity: "Islamabad",
    status: "sold",
    image: "/vehicles/bmw-x3.jpg",
    imageAlt: "Black BMW X3 SUV parked outdoors, front three-quarter view",
    description:
      "The xDrive30i is the petrol X3 with all-wheel drive. This 2018 car was automatic, 52,000 km, registered in Islamabad. It has since been sold.",
  },
];

/* ==========================================================================
   Selectors — components import these rather than filtering inline.
   ========================================================================== */

/** Vehicles shown in the homepage "Featured cars" grid. */
export function getFeaturedVehicles(): Vehicle[] {
  return vehicles.filter((v) => v.featured && v.status !== "sold");
}

/** Vehicles shown in the "Recently sold" strip. */
export function getRecentlySoldVehicles(limit = 4): Vehicle[] {
  return vehicles.filter((v) => v.status === "sold").slice(0, limit);
}

/** Single vehicle for a detail route. Returns undefined for an unknown slug. */
export function getVehicleById(id: string): Vehicle | undefined {
  return vehicles.find((vehicle) => vehicle.id === id);
}

/**
 * Other cars a buyer looking at `vehicle` would plausibly also want to see.
 *
 * Scored rather than filtered, because a hard filter ("same body type AND
 * within 20% on price") collapses to nothing for the less common cars — the
 * Hilux pickup and the BMW have no close match at all. Scoring always returns
 * `limit` results, and the strongest matches float to the top.
 *
 * Sold cars are never suggested: sending someone to a car they cannot buy is
 * the fastest way to lose the enquiry.
 */
export function getSimilarVehicles(vehicle: Vehicle, limit = 3): Vehicle[] {
  const pool = vehicles.filter(
    (candidate) => candidate.id !== vehicle.id && candidate.status !== "sold",
  );

  return pool
    .map((candidate) => {
      let score = 0;
      if (candidate.bodyType === vehicle.bodyType) score += 3;
      if (candidate.make === vehicle.make) score += 2;
      if (candidate.fuel === vehicle.fuel) score += 1;
      if (candidate.transmission === vehicle.transmission) score += 1;

      /* Price proximity is relative, so a cheap car is compared against other
         cheap cars rather than against something three times the money. */
      const priceGap = Math.abs(candidate.price - vehicle.price) / vehicle.price;
      if (priceGap <= 0.25) score += 2;
      else if (priceGap <= 0.6) score += 1;

      return { candidate, score, priceGap };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.priceGap !== b.priceGap) return a.priceGap - b.priceGap;
      return b.candidate.year - a.candidate.year;
    })
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

/* ==========================================================================
   Filter option lists — power the quick-search panel and the inventory page.

   The `get*` helpers below are derived from the stock that actually exists,
   not from the union of the domain types. That way the filter UI can never
   offer a facet that is guaranteed to return zero results — add a hybrid to
   the data and "Hybrid" appears in the filters on its own.
   ========================================================================== */

export function getMakes(): string[] {
  return [...new Set(vehicles.map((v) => v.make))].sort();
}

/** Models for a given make; returns all models when no make is selected. */
export function getModels(make?: string): string[] {
  const pool = make ? vehicles.filter((v) => v.make === make) : vehicles;
  return [...new Set(pool.map((v) => v.model))].sort();
}

export function getYears(): number[] {
  const years = [...new Set(vehicles.map((v) => v.year))].sort((a, b) => b - a);
  return years;
}

export function getRegistrationCities(): string[] {
  return [...new Set(vehicles.map((v) => v.registrationCity))].sort();
}

/* Domain order is defined here; the getters return only what is in stock. */
export const transmissions: Transmission[] = ["Automatic", "Manual"];
export const fuelTypes: FuelType[] = ["Petrol", "Diesel", "Hybrid", "Electric"];
export const bodyTypes: BodyType[] = [
  "Sedan",
  "Hatchback",
  "SUV",
  "Crossover",
  "Pickup",
];

export function getTransmissions(): Transmission[] {
  const present = new Set(vehicles.map((v) => v.transmission));
  return transmissions.filter((item) => present.has(item));
}

export function getFuelTypes(): FuelType[] {
  const present = new Set(vehicles.map((v) => v.fuel));
  return fuelTypes.filter((item) => present.has(item));
}

export function getBodyTypes(): BodyType[] {
  const present = new Set(vehicles.map((v) => v.bodyType));
  return bodyTypes.filter((item) => present.has(item));
}

/** Price bounds derived from stock, rounded to sensible steps for the UI. */
export function getPriceBounds(): { min: number; max: number } {
  const prices = vehicles.map((v) => v.price);
  return {
    min: Math.floor(Math.min(...prices) / 100_000) * 100_000,
    max: Math.ceil(Math.max(...prices) / 100_000) * 100_000,
  };
}

/**
 * Round price steps for the min/max selects on the inventory page. Kept as a
 * fixed ladder rather than derived from stock so the choices stay stable as
 * inventory changes.
 */
export const priceSteps = [
  2_000_000, 3_000_000, 4_000_000, 5_000_000, 6_000_000, 8_000_000,
  10_000_000, 15_000_000, 20_000_000, 30_000_000,
];

/** How many vehicles sit in each status — used for the filter option counts. */
export function getStatusCounts(): Record<VehicleStatus, number> {
  return vehicles.reduce(
    (acc, vehicle) => {
      acc[vehicle.status] += 1;
      return acc;
    },
    { available: 0, reserved: 0, sold: 0 } as Record<VehicleStatus, number>,
  );
}
