/** Warm, quiet map styling; geographic data and attribution stay with Google. */
export const LOCATOR_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f0f3f7" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#62665f" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#faf9f4" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dce4ee" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dceaf6" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e0ebcc" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
