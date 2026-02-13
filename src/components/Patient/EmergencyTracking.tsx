import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Phone, Truck, Navigation } from 'lucide-react';
import { GoogleMap } from '../Map/GoogleMap';
import { emergencyService, ambulanceService, hospitalService } from '../../services/firebaseService';
import { EmergencyRequest, Ambulance, Hospital } from '../../types';

interface EmergencyTrackingProps {
  requestId: string;
}

export const EmergencyTracking: React.FC<EmergencyTrackingProps> = ({
  requestId,
}) => {
  const [otherHospitals, setOtherHospitals] = useState<any[]>([]);
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [assignedAmbulance, setAssignedAmbulance] = useState<Ambulance | null>(null);
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [placesLoaded, setPlacesLoaded] = useState(false);
  const [etaText, setEtaText] = useState<string>();
  const [etaClock, setEtaClock] = useState<string>();


  const [googlePage, setGooglePage] = useState(0);
const GOOGLE_PER_PAGE = 2;

const totalGooglePages = Math.ceil(otherHospitals.length / GOOGLE_PER_PAGE);

const googleVisible = otherHospitals.slice(
  googlePage * GOOGLE_PER_PAGE,
  googlePage * GOOGLE_PER_PAGE + GOOGLE_PER_PAGE
);

// top of component
const ITEMS_PER_PAGE = 2;
const [page, setPage] = useState(0);

const totalPages = Math.ceil(nearbyHospitals.length / ITEMS_PER_PAGE);

const start = page * ITEMS_PER_PAGE;
const currentHospitals = nearbyHospitals.slice(start, start + ITEMS_PER_PAGE);


  

  useEffect(() => {
    const unsubscribe = emergencyService.subscribeToRequest(requestId, (updatedRequest) => {
      setRequest(updatedRequest);
      setLoading(false);

      // If ambulance is assigned, fetch ambulance details
      if (updatedRequest?.assignedAmbulanceId) {
        ambulanceService.getById(updatedRequest.assignedAmbulanceId).then(setAssignedAmbulance);
      }
    });

    return unsubscribe;
  }, [requestId]);

  useEffect(() => {
  const load = async () => {
    if (!request || !window.google) return;

    const hospitals = await hospitalService.getAll();

    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [request.location],
        destinations: hospitals.map((h) => h.location),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status !== "OK" || !response) {
          console.error("Distance Matrix failed:", status);
          return;
        }

        const results = response.rows[0].elements.map((el, index) => ({
          hospital: hospitals[index],
          distanceText: el.distance.text,
          distanceValue: el.distance.value,
          durationText: el.duration.text,
        }));

        results.sort((a, b) => a.distanceValue - b.distanceValue);

        setNearbyHospitals(
          results.map((r) => ({
            ...r.hospital,
            distanceText: r.distanceText,
            durationText: r.durationText,
          }))
        );
      }
    );
  };

  load();
}, [request]);

useEffect(() => {
  if (!assignedAmbulance || !request || !window.google) return;

  const calculate = () => {
    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [
          new google.maps.LatLng(
            assignedAmbulance.location.lat,
            assignedAmbulance.location.lng
          ),
        ],
        destinations: [
          new google.maps.LatLng(
            request.location.lat,
            request.location.lng
          ),
        ],
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status !== "OK" || !response?.rows?.length) return;

        const element = response.rows[0].elements[0];

        // minutes text (14 mins)
        setEtaText(element.duration.text);

        // arrival clock
        const arrival = new Date(
          Date.now() + element.duration.value * 1000
        );

        setEtaClock(
          arrival.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        );
      }
    );
  };

  calculate(); // first time

  const id = setInterval(calculate, 10000); // refresh every 10 sec

  return () => clearInterval(id);
}, [assignedAmbulance, request]);


useEffect(() => {
  if (!request || placesLoaded) return;

  // 🔴 CRITICAL: wait until places library is ready
  if (
    !window.google ||
    !google.maps ||
    !google.maps.places
  ) {
    console.log("Places library not ready yet");
    return;
  }

  console.log("Searching nearby hospitals from Google...");

  const placesService = new google.maps.places.PlacesService(
    document.createElement("div")
  );

  placesService.nearbySearch(
    {
      location: new google.maps.LatLng(
        request.location.lat,
        request.location.lng
      ),
      radius: 5000,
      type: "hospital",
    },
    (results, status) => {
      if (
        status !== google.maps.places.PlacesServiceStatus.OK ||
        !results ||
        results.length === 0
      ) {
        console.log("Places failed:", status);
        setOtherHospitals([]);
        return;
      }

      const valid = results.filter((r) => r.geometry?.location);

      if (!valid.length) {
        setOtherHospitals([]);
        return;
      }

      const matrix = new google.maps.DistanceMatrixService();

      matrix.getDistanceMatrix(
        {
          origins: [
            new google.maps.LatLng(
              request.location.lat,
              request.location.lng
            ),
          ],
          destinations: valid.map((r) => r.geometry!.location!),
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (res, matrixStatus) => {
          if (
            matrixStatus !== "OK" ||
            !res?.rows?.length
          ) {
            console.log("Matrix failed:", matrixStatus);
            return;
          }

          const enriched = valid.map((place, i) => {
            const el = res.rows[0].elements[i];

            return {
              ...place,
              distanceText: el?.distance?.text,
              durationText: el?.duration?.text,
              durationValue: el?.duration?.value,
            };
          });

          enriched.sort(
            (a, b) =>
              (a.durationValue ?? Infinity) -
              (b.durationValue ?? Infinity)
          );

          console.log("Final enriched hospitals:", enriched);

          setOtherHospitals(enriched.slice(0, 6));
          setPlacesLoaded(true);
        }
      );
    }
  );
}, [request]);

useEffect(() => {
  setGooglePage(0);
}, [otherHospitals]);







  const getStatusColor = (status: EmergencyRequest['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'assigned': return 'text-blue-600 bg-blue-100';
      case 'en_route': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: EmergencyRequest['status']) => {
    switch (status) {
      case 'pending': return 'Finding Ambulance...';
      case 'assigned': return 'Ambulance Assigned';
      case 'en_route': return 'Ambulance En Route';
      case 'completed': return 'Emergency Completed';
      case 'cancelled': return 'Request Cancelled';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Request Not Found</h2>
          <p className="text-gray-600">The emergency request could not be found.</p>
        </div>
      </div>
    );
  }

  const handleNavigate = (hospital: Hospital) => {
    if (!request) return;

    const origin = `${request.location.lat},${request.location.lng}`;
    const destination = `${hospital.location.lat},${hospital.location.lng}`;

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

    window.open(url, "_blank");
  };



  const hospitalPages = [];
  for (let i = 0; i < nearbyHospitals.length; i += ITEMS_PER_PAGE) {
    hospitalPages.push(nearbyHospitals.slice(i, i + ITEMS_PER_PAGE));
  }
console.log("Assigned ambulance object:", assignedAmbulance);
console.log("Ambulance location:", assignedAmbulance?.location);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">Emergency Tracking</h1>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
              {getStatusText(request.status)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Map */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <GoogleMap
  center={request.location}

  // patient
  patientLocation={request.location}

  // ambulance = origin
  userLocation={assignedAmbulance?.location}

  ambulances={assignedAmbulance ? [assignedAmbulance] : []}

  destination={request.location}
  showRoute={!!assignedAmbulance}

  hospitals={nearbyHospitals}
  className="h-96 w-full"
/>


        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Request Details</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600">Phone:</span>
                <span className="ml-2 font-medium">{request.patientPhone}</span>
              </div>
              {request.patientName && (
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 ml-7">Name:</span>
                  <span className="ml-2 font-medium">{request.patientName}</span>
                </div>
              )}
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600">Emergency Type:</span>
                <span className="ml-2 font-medium capitalize">{request.emergencyType}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600">Priority:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  request.priority === 'high' ? 'bg-red-100 text-red-800' :
                  request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {request.priority.toUpperCase()}
                </span>
              </div>
              {request.notes && (
                <div className="mt-4">
                  <span className="text-sm text-gray-600">Notes:</span>
                  <p className="mt-1 text-sm text-gray-800">{request.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Ambulance Details */}
          {assignedAmbulance ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Assigned Ambulance</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Truck className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">Vehicle:</span>
                  <span className="ml-2 font-medium">{assignedAmbulance.vehicleNumber}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 ml-7">Driver:</span>
                  <span className="ml-2 font-medium">{assignedAmbulance.driverName}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 ml-7">Type:</span>
                  <span className="ml-2 font-medium capitalize">{assignedAmbulance.type}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 ml-7">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    assignedAmbulance.status === 'available' ? 'bg-green-100 text-green-800' :
                    assignedAmbulance.status === 'on_trip' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {assignedAmbulance.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                {etaText && etaClock && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">
                        Arrives at {etaClock} ({etaText})
                      </span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Finding Ambulance</h2>
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mr-3"></div>
                <span className="text-gray-600">Searching for nearest available ambulance...</span>
              </div>
            </div>
          )}
        </div>

        

        {/* Hospitals */}
<div className="bg-white rounded-lg shadow-sm p-6">
  <h2 className="text-lg font-semibold text-gray-800 mb-4">
    Registered Nearby Hospitals
  </h2>

  {/* Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {[...currentHospitals, ...Array(ITEMS_PER_PAGE - currentHospitals.length)].map(
      (hospital, i) =>
        hospital ? (
          <div
            key={hospital.id}
            className="border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-800">
                  {hospital.name}
                </h3>

                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {hospital.address}
                </p>

                <div className="mt-1">
                  <Phone className="h-4 w-4 inline mr-2" />
                  <span className="text-sm text-gray-600">
                    {hospital.phone}
                  </span>
                </div>

                {hospital.distanceText && (
                  <p className="text-xs text-gray-500 mt-1">
                    🚗 {hospital.distanceText} • {hospital.durationText}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleNavigate(hospital)}
                className="p-2 text-gray-400 hover:text-blue-600 transition"
              >
                <Navigation className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-red-50 rounded">
                <div className="font-medium text-red-800">
                  {hospital.beds.icu}
                </div>
                <div className="text-red-600">ICU</div>
              </div>

              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-medium text-blue-800">
                  {hospital.beds.oxygen}
                </div>
                <div className="text-blue-600">Oxygen</div>
              </div>

              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-medium text-green-800">
                  {hospital.beds.general}
                </div>
                <div className="text-green-600">General</div>
              </div>
            </div>
          </div>
        ) : (
          <div
            key={`empty-${i}`}
            className="border border-transparent rounded-lg p-4"
          />
        )
    )}
  </div>

  {/* Pagination Arrows */}
{totalPages > 1 && (
  <div className="flex justify-center items-center gap-3 mt-6">
    <button
      disabled={page === 0}
      onClick={() => setPage((p) => p - 1)}
      className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
    >
      Prev
    </button>

    <span className="text-sm text-gray-600">
      Page {page + 1} / {totalPages}
    </span>

    <button
      disabled={page === totalPages - 1}
      onClick={() => setPage((p) => p + 1)}
      className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
    >
      Next
    </button>
  </div>
)}

</div>


             {/* other nearby Hospitals */}
  {/* ================= Other Nearby Hospitals (Google) ================= */}
<div className="bg-white rounded-lg shadow-sm p-6">
  <h2 className="text-lg font-semibold text-gray-800 mb-4">
    Other Nearby Hospitals
  </h2>

  {!otherHospitals.length && (
    <div className="text-gray-500 text-center py-4">
      Searching hospitals from Google...
    </div>
  )}

  {/* GRID = ONLY CARDS */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {googleVisible.map((place) => {
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();
      if (!lat || !lng) return null;

      return (
        <div
          key={place.place_id}
          className="border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-gray-800">
                {place.name}
              </h3>

              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {place.vicinity}
              </p>

              {(place.distanceText || place.rating) && (
                <p className="text-xs text-gray-500 mt-1">
                  {place.distanceText && (
                    <>🚗 {place.distanceText} • {place.durationText}</>
                  )}

                  {place.distanceText && place.rating && " • "}

                  {place.rating && <>⭐ {place.rating}</>}
                </p>
              )}

            </div>

            <button
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                window.open(url, "_blank");
              }}
              className="p-2 text-gray-400 hover:text-blue-600 transition"
            >
              <Navigation className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3 text-xs bg-gray-100 p-2 rounded">
            Bed availability not shared
          </div>
        </div>
      );
    })}
  </div>

  {/* PAGINATION = OUTSIDE GRID */}
  {totalGooglePages > 1 && (
    <div className="flex justify-center items-center gap-3 mt-6">
      <button
        disabled={googlePage === 0}
        onClick={() => setGooglePage((p) => p - 1)}
        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
      >
        Prev
      </button>

      <span className="text-sm text-gray-600">
        Page {googlePage + 1} / {totalGooglePages}
      </span>

      <button
        disabled={googlePage === totalGooglePages - 1}
        onClick={() => setGooglePage((p) => p + 1)}
        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  )}
</div>




      </div>
    </div>
  );
};



