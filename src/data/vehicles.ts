import type { Vehicle } from "@/types/vehicle";

/**
 * ============================================================================
 * SEED SOURCE — the reference dataset. The app does NOT read this any more.
 * ============================================================================
 * Live stock comes from Supabase. This array is what `supabase/seed.sql` was
 * generated from and what `qa/verify-seed.mjs` compares the live table against,
 * so it is kept as the written record of what the database is supposed to
 * contain.
 *
 * **Nothing under `src/app` or `src/components` imports this file.** If you are
 * looking for the filtering, sorting or option lists, they moved to
 * `src/lib/facets.ts` and now take a vehicle list as an argument — because the
 * list is fetched, not imported. Adding a `get*` helper back here would quietly
 * reintroduce a second source of truth for the inventory.
 *
 * **To change what the site shows, edit the row in Supabase.** Editing it here
 * changes nothing on the site; it only changes what the next seed would
 * produce, and would then disagree with the database.
 *
 * Images in /public/vehicles are free-licence stock photos standing in for
 * ZK Motors' own photography. The live rows point at the copies uploaded to
 * Supabase Storage, not at these files — these are the originals they were
 * uploaded from. Swap both, keeping the same filenames, and update `imageAlt`
 * to describe the real vehicle.
 *
 * `description` is written from the facts in each record — year, trim,
 * mileage, transmission, registration city — plus what the trim level means
 * within that model range. It deliberately makes **no** claims about the
 * condition of an individual car. Do not add "immaculate", "accident-free" or
 * similar to these: nothing on this site has been inspected.
 *
 * `highlight` is the one field that does carry a condition claim, and it is
 * placeholder text to be replaced with real, verified information.
 */

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
