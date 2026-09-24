import type {
  BodyType,
  FuelType,
  Transmission,
  VehicleStatus,
} from "@/types/vehicle";

/**
 * Hand-written mirror of `supabase/migrations/0001_vehicles.sql`.
 *
 * Supabase can generate this file (`supabase gen types typescript --linked`)
 * and that is the better long-term source — regenerate it once the Supabase CLI
 * is linked to the project, and delete this comment. Until then this is written
 * by hand, which means it can drift.
 *
 * It is not left to drift silently: `scripts/verify_schema.py` parses the
 * `VehicleRow` field list below and compares it against the columns the
 * migration actually creates. Add a column to one and not the other and that
 * script fails.
 *
 * Note the case boundary. Postgres uses snake_case (`body_type`); the app's
 * `Vehicle` type uses camelCase (`bodyType`). The translation happens in one
 * place — `toVehicle()` / `toAdminVehicle()` in `src/lib/vehicle-mapper.ts` —
 * and nowhere else.
 */

/**
 * Exactly the columns of `public.vehicles`, in migration order.
 *
 * **A `type` alias, not an `interface` — and that is load-bearing.**
 * `supabase-js` only applies this `Database` type if `Database["public"]`
 * satisfies `GenericSchema`, whose `Tables` is `Record<string, GenericTable>`,
 * whose `Row`/`Insert`/`Update` are each `Record<string, unknown>`. TypeScript
 * gives an `interface` no implicit index signature, so `interface VehicleRow`
 * fails that check: the schema silently falls back to `any`, every `.select()`
 * returns `any`, and `.insert()` resolves its parameter to `never`. Nothing
 * errors at the point of the mistake — the type safety just quietly disappears,
 * which is how it survived until the first write path was written.
 *
 * Supabase's own generated types use `type` for exactly this reason. If you
 * replace this file with `supabase gen types typescript`, the shape stays
 * compatible.
 */
export type VehicleRow = {
  id: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  price: number;
  mileage: number;
  /* These four are `text` with a CHECK in Postgres. Using the app's unions here
     rather than `string` means a bad value is caught at compile time instead of
     arriving as a runtime surprise from a row someone edited by hand. */
  transmission: Transmission;
  fuel: FuelType;
  body_type: BodyType;
  registration_city: string;
  status: VehicleStatus;
  image: string;
  image_alt: string;
  highlight: string | null;
  description: string | null;
  gallery: string[];
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

/** Required columns are those without a default in the migration. */
export type VehicleInsert = {
  id: string;
  make: string;
  model: string;
  variant?: string | null;
  year: number;
  price: number;
  mileage: number;
  transmission: Transmission;
  fuel: FuelType;
  body_type: BodyType;
  registration_city: string;
  status?: VehicleStatus;
  image: string;
  image_alt: string;
  highlight?: string | null;
  description?: string | null;
  gallery?: string[];
  featured?: boolean;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type VehicleUpdate = Partial<VehicleInsert>;

export type Database = {
  public: {
    Tables: {
      vehicles: {
        Row: VehicleRow;
        Insert: VehicleInsert;
        Update: VehicleUpdate;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
