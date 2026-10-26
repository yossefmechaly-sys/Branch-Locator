"use client";

import { useEffect, useRef, useState } from "react";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { loadGoogleMaps } from "@/lib/maps/providers/google/loader";

interface AdminLocationMapProps {
  latitude: string;
  longitude: string;
}

export function AdminLocationMap({
  latitude,
  longitude,
}: AdminLocationMapProps) {
  const { dictionary } = useAdminI18n();
  const tAdmin = dictionary.branches;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || !hasCoordinates) return;

    const maps = window.google.maps;
    const position = { lat, lng };

    if (!mapRef.current) {
      mapRef.current = new maps.Map(containerRef.current, {
        center: position,
        zoom: 16,
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        clickableIcons: false,
      });

      markerRef.current = new maps.Marker({
        map: mapRef.current,
        position,
      });

      return;
    }

    mapRef.current.setCenter(position);

    if (!markerRef.current) {
      markerRef.current = new maps.Marker({
        map: mapRef.current,
        position,
      });
    } else {
      markerRef.current.setPosition(position);
    }
  }, [ready, hasCoordinates, lat, lng]);

  if (loadError) {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        {tAdmin.mapLoadError}
      </div>
    );
  }

  if (!hasCoordinates) {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        {tAdmin.mapNoCoordinates}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[320px] w-full overflow-hidden rounded-md border"
    />
  );
}
