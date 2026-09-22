import { siteConfig } from "@/config/site";
import { formatMileage, formatPKR } from "@/lib/format";

/**
 * Build a wa.me deep link with a pre-filled message.
 * Returns null when no WhatsApp number is configured, so callers can hide
 * the action rather than render a broken link.
 */
export function buildWhatsAppUrl(message?: string): string | null {
  const number = siteConfig.contact.whatsappNumber;
  if (!number) return null;

  const text = message ?? siteConfig.whatsappMessage;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** Enquiry message for a specific vehicle. */
export function vehicleEnquiryMessage(vehicle: {
  make: string;
  model: string;
  year: number;
}): string {
  return `Hello ZK Motors, I am interested in the ${vehicle.year} ${vehicle.make} ${vehicle.model}. Is it still available?`;
}

/** Enquiry message for someone selling or exchanging a car. */
export const sellEnquiryMessage =
  "Hello ZK Motors, I would like to sell or exchange my car. Here are the details:";

/** What the sell form collects, once the strings have been parsed. */
export type SellEnquiryDetails = {
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
  fuel: string;
  city: string;
  condition: string;
  /** Optional — plenty of sellers have no figure in mind, and that is fine. */
  expectedPrice?: number;
  name: string;
  phone: string;
  notes?: string;
};

/**
 * Compose the sell/exchange enquiry as a WhatsApp message.
 *
 * There is no backend until Phase 5, so this message *is* the submission: the
 * form fills it in and hands the visitor to WhatsApp, where they still have to
 * press send. Building it here rather than in the component keeps the wording
 * with every other message the site sends, and makes it checkable without
 * rendering anything.
 */
export function sellVehicleMessage(details: SellEnquiryDetails): string {
  const lines = [
    sellEnquiryMessage,
    "",
    `Car: ${details.year} ${details.make} ${details.model}`,
    `Mileage: ${formatMileage(details.mileage)}`,
    `Transmission: ${details.transmission}`,
    `Fuel: ${details.fuel}`,
    `City: ${details.city}`,
    `Condition: ${details.condition}`,
  ];

  if (details.expectedPrice) {
    lines.push(`Expected price: ${formatPKR(details.expectedPrice)}`);
  }

  lines.push("", `Name: ${details.name}`, `Phone: ${details.phone}`);

  if (details.notes) {
    lines.push(`Notes: ${details.notes}`);
  }

  return lines.join("\n");
}

/**
 * Enquiry for a car that has already sold.
 *
 * A sold listing still attracts messages, and the honest thing to ask for is
 * comparable stock rather than pretending the car is available. Sending the
 * "is it still available?" message about a sold car just wastes a round trip.
 */
export function soldVehicleEnquiryMessage(vehicle: {
  make: string;
  model: string;
  year: number;
}): string {
  return `Hello ZK Motors, I saw the ${vehicle.year} ${vehicle.make} ${vehicle.model} on your site but it is marked sold. Do you have anything similar coming in?`;
}
