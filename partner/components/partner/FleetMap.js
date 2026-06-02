// PATH: componentsFleetMap.js
'use client';
import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { savedCurrencySymbol } from '@/lib/utils/format';

const STATUS_COLOR = {
  ONLINE: '#10B981',
  ON_TRIP: '#EF4444',
  EN_ROUTE: '#F59E0B',
  OFFLINE: '#6B7280',
  PENDING: '#F59E0B',
  SUSPENDED: '#EF4444',
};

export default function FleetMap({ pins = [], height = 400, initialZoom = 13 }) {
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const containerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialise Leaflet map once
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return;

    let cleanup = false;
    import('leaflet').then((L) => {
      if (cleanup || !containerRef.current || mapRef.current) return;

      // Fix default icon paths in Next.js
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current, { zoomControl: true }).setView([-15.4167, 28.2833], initialZoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      cleanup = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current.clear();
        setMapReady(false);
      }
    };
  }, [initialZoom]);

  // Update markers when pins change
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    import('leaflet').then((L) => {
      const map = mapRef.current;
      if (!map) return;

      const currentIds = new Set(pins.filter((p) => p.lat && p.lng).map((p) => p.driverId));

      // Remove stale markers
      markersRef.current.forEach((marker, id) => {
        if (!currentIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      });

      pins.forEach((pin) => {
        if (!pin.lat || !pin.lng) return;
        const color = STATUS_COLOR[pin.status] ?? '#6B7280';
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:36px;height:36px;border-radius:50%;background:${color};border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.4);cursor:pointer;">
            <span style="font-size:14px;color:white;font-weight:800;">${pin.driverName.charAt(0).toUpperCase()}</span>
          </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const popupContent = `<div style="font-family:sans-serif;min-width:180px;">
          <div style="font-weight:700;font-size:0.95rem;margin-bottom:4px;">${pin.driverName}</div>
          <div style="color:${color};font-size:0.75rem;font-weight:600;margin-bottom:6px;">${pin.status}</div>
          <div style="font-size:0.8rem;color:#555;margin-bottom:6px;">Float: <strong>${savedCurrencySymbol()}${Number(pin.floatBalance).toFixed(2)}</strong></div>
          <div style="display:flex;gap:8px;">
            <a href="tel:${pin.phoneDigits}" style="padding:4px 10px;border-radius:6px;background:#059669;color:white;text-decoration:none;font-size:0.75rem;font-weight:700;">📞 Call</a>
            <a href="https://wa.me/${pin.phoneDigits}" target="_blank" style="padding:4px 10px;border-radius:6px;background:#25D366;color:white;text-decoration:none;font-size:0.75rem;font-weight:700;">💬 WhatsApp</a>
          </div>
        </div>`;

        if (markersRef.current.has(pin.driverId)) {
          const existing = markersRef.current.get(pin.driverId);
          existing.setLatLng([pin.lat, pin.lng]);
          existing.setIcon(icon);
        } else {
          const marker = L.marker([pin.lat, pin.lng], { icon })
            .addTo(map)
            .bindPopup(popupContent, { maxWidth: 240 });
          markersRef.current.set(pin.driverId, marker);
        }
      });
    });
  }, [pins, mapReady]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height, borderRadius: 3, overflow: 'hidden' }}>
      {/* Legend */}
      <Box
        sx={{
          position: 'absolute', top: 12, right: 12, zIndex: 1000,
          background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)',
          borderRadius: 2, p: 1, display: 'flex', flexDirection: 'column', gap: 0.5,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {Object.entries(STATUS_COLOR).slice(0, 4).map(([status, color]) => (
          <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              {status}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Leaflet CSS */}
      <style>{`@import url('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');`}</style>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </Box>
  );
}
