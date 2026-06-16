"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = markerIcon;

const DEFAULT_CENTER = { lat: 10.7769, lng: 106.7009 };

interface StoreLocationPickerProps {
  lat: number;
  lng: number;
  onChange: (coords: { lat: number; lng: number }) => void;
  active?: boolean;
  flyTo?: { lat: number; lng: number } | null;
}

function MapResizeHandler({ active }: { active?: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!active) return;

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [active, map]);

  return null;
}

function MapClickHandler({
  onChange,
}: {
  onChange: StoreLocationPickerProps["onChange"];
}) {
  useMapEvents({
    click(event) {
      onChange({
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return null;
}

function FlyToHandler({
  target,
}: {
  target: { lat: number; lng: number } | null | undefined;
}) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], 16, { duration: 0.8 });
  }, [target, map]);

  return null;
}

export function StoreLocationPicker({
  lat,
  lng,
  onChange,
  active,
  flyTo,
}: StoreLocationPickerProps) {
  const position = {
    lat: Number.isFinite(lat) ? lat : DEFAULT_CENTER.lat,
    lng: Number.isFinite(lng) ? lng : DEFAULT_CENTER.lng,
  };

  return (
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={13}
      scrollWheelZoom
      className="h-[280px] w-full rounded-lg border border-border z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapResizeHandler active={active} />
      <MapClickHandler onChange={onChange} />
      <FlyToHandler target={flyTo} />
      <Marker
        draggable
        position={[position.lat, position.lng]}
        eventHandlers={{
          dragend: (event) => {
            const marker = event.target;
            const { lat: nextLat, lng: nextLng } = marker.getLatLng();
            onChange({
              lat: Number(nextLat.toFixed(6)),
              lng: Number(nextLng.toFixed(6)),
            });
          },
        }}
      />
    </MapContainer>
  );
}
