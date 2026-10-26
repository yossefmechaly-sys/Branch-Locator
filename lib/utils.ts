import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne des classes Tailwind conditionnelles en résolvant les conflits.
 * Utilisé par tous les composants `components/ui/*` (fondations shadcn/ui).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Garde uniquement les chiffres (wa.me n'accepte pas les espaces/tirets/`+`). */
export function toWhatsAppHref(phoneNumber: string): string {
  return `https://wa.me/${phoneNumber.replace(/\D/g, "")}`;
}

/** `tel:` tolère `+`, mais pas les espaces ni les tirets décoratifs. */
export function toTelHref(phoneNumber: string): string {
  return `tel:${phoneNumber.replace(/[\s-]/g, "")}`;
}
