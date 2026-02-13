import React, { useEffect, useRef, useState } from 'react';
import { Location, Ambulance, Hospital } from '../../types';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';

interface GoogleMapProps {
  center: Location;
  zoom?: number;
  patientLocation?: Location;

  ambulances?: Ambulance[];
  hospitals?: Hospital[];
  googleHospitals?: google.maps.places.PlaceResult[];
  userLocation?: Location;

  selectedAmbulance?: Ambulance;
  onAmbulanceSelect?: (ambulance: Ambulance) => void;

  showRoute?: boolean;
  destination?: Location;

  onMapLoad?: (map: google.maps.Map) => void;
  className?: string;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({
  center,
  zoom = 13,
  ambulances = [],
  hospitals = [],
  googleHospitals = [],
  userLocation,
  patientLocation,
  onAmbulanceSelect,
  showRoute = false,
  destination,
  onMapLoad,
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);

  const { isLoaded, loadError } = useGoogleMaps();

  /* ================================================= */
  /* INIT MAP                                          */
  /* ================================================= */
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const googleMap = new google.maps.Map(mapRef.current, {
      center,
      zoom,
    });

    const renderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true, // ✅ WE DRAW OUR OWN
      polylineOptions: {
        strokeColor: '#ef4444',
        strokeWeight: 5,
      },
    });

    renderer.setMap(googleMap);

    setMap(googleMap);
    setDirectionsRenderer(renderer);

    onMapLoad?.(googleMap);
  }, [isLoaded, map]);

  /* ================================================= */
  /* UPDATE CENTER                                     */
  /* ================================================= */
  useEffect(() => {
    if (map) map.setCenter(center);
  }, [center, map]);

  /* ================================================= */
  /* CLEAR MARKERS                                     */
  /* ================================================= */
  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  };

  /* ================================================= */
  /* DRAW MARKERS                                      */
  /* ================================================= */
  useEffect(() => {
    if (!map) return;

    clearMarkers();

    /* ========== DRIVER / AMBULANCE SELF ========== */
    if (userLocation) {
      const marker = new google.maps.Marker({
        position: userLocation,
        map,
        title: 'Your Ambulance',
        icon: {
          url: '/markers/ambulance.png',
          scaledSize: new google.maps.Size(40, 40),
        },
        zIndex: 1000,
      });

      markersRef.current.push(marker);
    }

    /* ========== PATIENT ========== */
    if (patientLocation) {
      const marker = new google.maps.Marker({
        position: patientLocation,
        map,
        title: 'Patient',
        icon: {
          url: '/markers/patient.png',
          scaledSize: new google.maps.Size(40, 40),
        },
        zIndex: 1001,
      });

      markersRef.current.push(marker);
    }

    /* ========== OTHER AMBULANCES (if any) ========== */
    ambulances.forEach((ambulance) => {
      const marker = new google.maps.Marker({
        position: ambulance.location,
        map,
        title: `Ambulance ${ambulance.vehicleNumber}`,
        icon: {
          url: '/markers/ambulance.png',
          scaledSize: new google.maps.Size(35, 35),
        },
      });

      marker.addListener('click', () => {
        onAmbulanceSelect?.(ambulance);
      });

      markersRef.current.push(marker);
    });

    /* ========== FIREBASE HOSPITALS ========== */
    hospitals.forEach((hospital) => {
      const marker = new google.maps.Marker({
        position: hospital.location,
        map,
        title: hospital.name,
        icon: {
          url: '/markers/hospital.png',
          scaledSize: new google.maps.Size(35, 35),
        },
      });

      markersRef.current.push(marker);
    });

    /* ========== GOOGLE HOSPITALS ========== */
    googleHospitals.forEach((hospital) => {
      if (!hospital.geometry?.location) return;

      const marker = new google.maps.Marker({
        position: hospital.geometry.location,
        map,
        title: hospital.name,
      });

      markersRef.current.push(marker);
    });
  }, [
    map,
    userLocation,
    patientLocation, // ✅ important
    ambulances,
    hospitals,
    googleHospitals,
  ]);

  /* ================================================= */
  /* ROUTING                                            */
  /* ================================================= */
  useEffect(() => {
    if (!map || !directionsRenderer) return;

    if (!showRoute || !userLocation || !destination) {
      directionsRenderer.setDirections({ routes: [] } as any);
      return;
    }

    const service = new google.maps.DirectionsService();

    service.route(
      {
        origin: userLocation,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);

          const bounds = new google.maps.LatLngBounds();
          bounds.extend(userLocation);
          bounds.extend(destination);
          map.fitBounds(bounds);
        }
      }
    );
  }, [map, directionsRenderer, showRoute, userLocation, destination]);

  /* ================================================= */
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
