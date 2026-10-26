import {
  Accessibility,
  Beef,
  Carrot,
  Croissant,
  Ham,
  Headset,
  MessageCircle,
  ParkingCircle,
  ScanBarcode,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";

/**
 * Résolution `Service.icon` (chaîne stockée en base, ex. "parking-circle") vers un
 * composant Lucide. Table explicite plutôt qu'un accès dynamique à tout le module
 * `lucide-react` : toute nouvelle icône de service (Phase 9, back-office) doit être
 * ajoutée ici en même temps — évite qu'une faute de frappe dans l'admin fasse
 * disparaître silencieusement une icône en production.
 */
const SERVICE_ICONS: Record<string, LucideIcon> = {
  truck: Truck,
  beef: Beef,
  croissant: Croissant,
  carrot: Carrot,
  ham: Ham,
  "parking-circle": ParkingCircle,
  accessibility: Accessibility,
  "scan-barcode": ScanBarcode,
  headset: Headset,
  "message-circle": MessageCircle,
};

export interface ServiceIconProps {
  icon: string;
  className?: string;
}

export function ServiceIcon({ icon, className }: ServiceIconProps) {
  const Icon = SERVICE_ICONS[icon] ?? Store;
  return <Icon className={className} aria-hidden="true" />;
}
