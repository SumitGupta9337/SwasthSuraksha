import React, { useEffect, useRef, useState } from 'react';
import { Location, Ambulance, Hospital } from '../../types';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';

interface GoogleMapProps {
  center: Location;
  zoom?: number;

  ambulances?: Ambulance[];
  hospitals?: Hospital[]; // Firebase hospitals (optional)

  googleHospitals?: google.maps.places.PlaceResult[]; // 🔴 NEW
  userLocation?: Location;

  selectedAmbulance?: Ambulance;
  onAmbulanceSelect?: (ambulance: Ambulance) => void;

  showRoute?: boolean;
  onMapLoad?: (map: google.maps.Map) => void; // 🔴 NEW
  className?: string;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({
  center,
  zoom = 13,
  ambulances = [],
  hospitals = [],
  googleHospitals = [],
  userLocation,
  selectedAmbulance,
  onAmbulanceSelect,
  showRoute = false,
  onMapLoad,
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);

  const { isLoaded, loadError } = useGoogleMaps();

  // Initialize map
  useEffect(() => {
    if (isLoaded && mapRef.current && !map) {
      const googleMap = new google.maps.Map(mapRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom,
      });

      const renderer = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#ef4444',
          strokeWeight: 4,
        },
      });

      renderer.setMap(googleMap);

      setMap(googleMap);
      setDirectionsRenderer(renderer);

      if (onMapLoad) onMapLoad(googleMap);
    }
  }, [isLoaded, map, center, zoom, onMapLoad]);

  // Update center
  useEffect(() => {
    if (map) {
      map.setCenter({ lat: center.lat, lng: center.lng });
    }
  }, [map, center]);

  // User location marker
  useEffect(() => {
    if (!map || !userLocation) return;

    new google.maps.Marker({
      position: userLocation,
      map,
      title: 'User Location',
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      },
    });
  }, [map, userLocation]);

  // Ambulance markers
  useEffect(() => {
    if (!map) return;

    ambulances.forEach((ambulance) => {
      const marker = new google.maps.Marker({
        position: ambulance.location,
        map,
        title: `Ambulance ${ambulance.vehicleNumber}`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        },
      });

      marker.addListener('click', () => {
        onAmbulanceSelect?.(ambulance);
      });
    });
  }, [map, ambulances, onAmbulanceSelect]);

  // Firebase hospitals (optional / registered)
  useEffect(() => {
    if (!map) return;

    hospitals.forEach((hospital) => {
      new google.maps.Marker({
        position: hospital.location,
        map,
        title: hospital.name,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        },
      });
    });
  }, [map, hospitals]);

  // 🔴 LIVE GOOGLE HOSPITALS
  useEffect(() => {
    if (!map) return;

    googleHospitals.forEach((hospital) => {
      if (!hospital.geometry?.location) return;

      new google.maps.Marker({
        position: hospital.geometry.location,
        map,
        title: hospital.name,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/hospitals.png',
        },
      });
    });
  }, [map, googleHospitals]);

  // Route rendering
  useEffect(() => {
    if (
      !map ||
      !directionsRenderer ||
      !showRoute ||
      !selectedAmbulance ||
      !userLocation
    )
      return;

    const service = new google.maps.DirectionsService();

    service.route(
      {
        origin: selectedAmbulance.location,
        destination: userLocation,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
        }
      }
    );
  }, [map, directionsRenderer, showRoute, selectedAmbulance, userLocation]);

  if (loadError) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        Error loading Google Maps
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        Loading map...
      </div>
    );
  }

  return <div ref={mapRef} className={className} />;
};
