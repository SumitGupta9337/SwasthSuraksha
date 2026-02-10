import React, { useState, useEffect } from 'react';
import { GoogleMap } from '../Map/GoogleMap';
import {
  emergencyService,
  ambulanceService,
  hospitalService,
} from '../../services/firebaseService';
import { EmergencyRequest, Ambulance, Hospital } from '../../types';

interface EmergencyTrackingProps {
  requestId: string;
}

export const EmergencyTracking: React.FC<EmergencyTrackingProps> = ({
  requestId,
}) => {
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [assignedAmbulance, setAssignedAmbulance] =
    useState<Ambulance | null>(null);

  // Registered hospitals from Firebase
  const [registeredHospitals, setRegisteredHospitals] = useState<Hospital[]>(
    []
  );

  // Live hospitals from Google
  const [googleHospitals, setGoogleHospitals] = useState<
    google.maps.places.PlaceResult[]
  >([]);

  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to request
  useEffect(() => {
    const unsubscribe = emergencyService.subscribeToRequest(
      requestId,
      (updatedRequest) => {
        setRequest(updatedRequest);
        setLoading(false);

        if (updatedRequest?.assignedAmbulanceId) {
          ambulanceService
            .getById(updatedRequest.assignedAmbulanceId)
            .then(setAssignedAmbulance);
        }
      }
    );

    return unsubscribe;
  }, [requestId]);

  // Fetch registered hospitals
  useEffect(() => {
    hospitalService.getAll().then(setRegisteredHospitals);
  }, []);

  // Fetch nearby Google hospitals
  useEffect(() => {
    if (!request || !mapInstance || !window.google) return;

    const service = new google.maps.places.PlacesService(mapInstance);

    service.nearbySearch(
      {
        location: new google.maps.LatLng(
          request.location.lat,
          request.location.lng
        ),
        radius: 5000,
        type: 'hospital',
      },
      (results, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          results
        ) {
          setGoogleHospitals(results);
        }
      }
    );
  }, [request, mapInstance]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-red-600 rounded-full" />
      </div>
    );
  }

  if (!request) {
    return <div className="text-center mt-10">Request not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* MAP */}
        <GoogleMap
          center={request.location}
          userLocation={request.location}
          ambulances={assignedAmbulance ? [assignedAmbulance] : []}
          hospitals={registeredHospitals}
          googleHospitals={googleHospitals}
          onMapLoad={setMapInstance}
          showRoute={!!assignedAmbulance}
          className="h-96 w-full rounded-lg"
        />

        {/* REGISTERED */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            Registered with SwasthSuraksha
          </h2>

          {registeredHospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="border rounded-lg p-4 mb-3 bg-green-50"
            >
              <div className="flex justify-between">
                <h3 className="font-medium">{hospital.name}</h3>
                <span className="text-green-600 text-sm">REGISTERED</span>
              </div>

              <p className="text-sm text-gray-600">{hospital.address}</p>

              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div className="bg-red-100 p-2 rounded text-center">
                  {hospital.beds.icu} ICU
                </div>
                <div className="bg-blue-100 p-2 rounded text-center">
                  {hospital.beds.oxygen} Oxygen
                </div>
                <div className="bg-green-100 p-2 rounded text-center">
                  {hospital.beds.general} General
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* GOOGLE */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            Other Nearby Hospitals (Live)
          </h2>

          {googleHospitals.map((hospital) => (
            <div key={hospital.place_id} className="border rounded-lg p-4 mb-3">
              <div className="flex justify-between">
                <h3 className="font-medium">{hospital.name}</h3>
                <span className="text-gray-400 text-sm">NOT REGISTERED</span>
              </div>

              <p className="text-sm text-gray-600">{hospital.vicinity}</p>

              <p className="text-xs text-yellow-600 mt-2">
                Bed availability data unavailable
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
