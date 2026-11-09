/** Warm, quiet map styling; geographic data and attribution stay with Google. */
export const LOCATOR_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f0eee5" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#62665f" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#faf9f4" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e8dcb7" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#d5e5df" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e0ebcc" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
