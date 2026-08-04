import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

type LocationMapProps = {
  center: [number, number];
  onLocationChange: (lat: number, lng: number, addressText: string) => void;
};

// Component to handle Map centering programmatically when center prop changes
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Component to handle map drag/click updates
function MapEvents({ onDragEnd }: { onDragEnd: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    dragend: () => {
      const center = map.getCenter();
      onDragEnd(center.lat, center.lng);
    },
    click: (e) => {
      onDragEnd(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function LocationMap({ center, onLocationChange }: LocationMapProps) {
  const [position, setPosition] = useState<[number, number]>(center);

  useEffect(() => {
    setPosition(center);
  }, [center]);

  const handlePositionUpdate = async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    // Reverse geocode using OpenStreetMap Nominatim
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          onLocationChange(lat, lng, data.display_name);
        } else {
          onLocationChange(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      } else {
        onLocationChange(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch {
      onLocationChange(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={position}
        zoom={15}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={position} />
        <MapEvents onDragEnd={handlePositionUpdate} />
        <Marker position={position} />
      </MapContainer>
    </div>
  );
}
