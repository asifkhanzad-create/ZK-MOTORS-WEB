import { siteConfig } from "@/config/site";

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
