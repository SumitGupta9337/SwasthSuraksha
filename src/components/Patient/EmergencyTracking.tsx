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
  const ITEMS_PER_PAGE = 2;
  const [page, setPage] = useState(0);
  const [registeredHospitalsError, setRegisteredHospitalsError] = useState<string | null>(null);
  const [allRegisteredHospitals, setAllRegisteredHospitals] = useState<Hospital[]>([]);

  // Fetch all registered hospitals once
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const hospitals = await hospitalService.getAll();
        console.log("All registered hospitals:", hospitals);
        setAllRegisteredHospitals(hospitals);
      } catch (error) {
        console.error("Error fetching hospitals:", error);
        setRegisteredHospitalsError("Failed to load hospitals");
      }
    };
    fetchHospitals();
  }, []);

  // Subscribe to the specific emergency request
  useEffect(() => {
    console.log("Subscribing to request:", requestId);
    
    const unsubscribe = emergencyService.subscribeToRequest(requestId, (updatedRequest) => {
      console.log("Request updated:", updatedRequest);
      
      if (updatedRequest) {
        setRequest(updatedRequest);
        setLoading(false);

        // If ambulance is assigned, fetch its details
        if (updatedRequest.assignedAmbulanceId) {
          console.log("Fetching ambulance:", updatedRequest.assignedAmbulanceId);
          ambulanceService.getById(updatedRequest.assignedAmbulanceId).then(amb => {
            console.log("Assigned ambulance:", amb);
            setAssignedAmbulance(amb);
          });
        } else {
          setAssignedAmbulance(null);
        }
      }
    });

    return () => unsubscribe();
  }, [requestId]);

  // Load registered hospitals with distance matrix when request location is available
  useEffect(() => {
    const loadNearbyHospitals = async () => {
      if (!request?.location || !window.google || allRegisteredHospitals.length === 0) {
        console.log("Waiting for request location, Google Maps, or hospitals...");
        return;
      }

      console.log("Loading nearby hospitals from registered list...");
      console.log("Request location:", request.location);
      console.log("Total registered hospitals:", allRegisteredHospitals.length);

      try {
        const service = new google.maps.DistanceMatrixService();

        service.getDistanceMatrix(
          {
            origins: [request.location],
            destinations: allRegisteredHospitals.map((h) => h.location),
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (response, status) => {
            if (status !== "OK" || !response) {
              console.error("Distance Matrix failed:", status);
              setRegisteredHospitalsError(`Distance Matrix failed: ${status}`);
              
              // Still show hospitals without distance info
              setNearbyHospitals(allRegisteredHospitals.map(h => ({
                ...h,
                distanceText: "Distance unknown",
                durationText: "Time unknown",
              })));
              return;
            }

            console.log("Distance Matrix response:", response);

            const results = response.rows[0].elements.map((el, index) => ({
              hospital: allRegisteredHospitals[index],
              distanceText: el.distance?.text || "Unknown",
              distanceValue: el.distance?.value || Infinity,
              durationText: el.duration?.text || "Unknown",
            }));

            // Sort by distance
            results.sort((a, b) => a.distanceValue - b.distanceValue);

            const hospitalsWithDistance = results.map((r) => ({
              ...r.hospital,
              distanceText: r.distanceText,
              durationText: r.durationText,
            }));

            console.log("Hospitals with distance:", hospitalsWithDistance.length);
            setNearbyHospitals(hospitalsWithDistance);
            setRegisteredHospitalsError(null);
          }
        );
      } catch (error) {
        console.error("Error in distance matrix:", error);
        setRegisteredHospitalsError(`Error calculating distances: ${error}`);
      }
    };

    loadNearbyHospitals();
  }, [request, allRegisteredHospitals]);

  // Calculate ETA for assigned ambulance
  useEffect(() => {
    if (!assignedAmbulance || !request || !window.google) return;

    const calculateETA = () => {
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
          setEtaText(element.duration.text);

          const arrival = new Date(Date.now() + element.duration.value * 1000);
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

    calculateETA();
    const interval = setInterval(calculateETA, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [assignedAmbulance, request]);

  // Helper function to calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  // Load Google Places hospitals
  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;

    const searchGoogleHospitals = () => {
      if (!request?.location) return;

      if (!window.google?.maps?.places) {
        console.log("Places library not ready, retrying...");
        retryTimeout = setTimeout(searchGoogleHospitals, 1000);
        return;
      }

      console.log("Searching Google for nearby hospitals...");
      
      const placesService = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );

      const nearbyRequest = {
        location: new window.google.maps.LatLng(
          request.location.lat,
          request.location.lng
        ),
        radius: 5000,
        type: 'hospital'
      };

      placesService.nearbySearch(nearbyRequest, (nearbyResults, nearbyStatus) => {
        if (!isMounted) return;

        let allResults: google.maps.places.PlaceResult[] = [];

        if (nearbyStatus === window.google.maps.places.PlacesServiceStatus.OK && nearbyResults) {
          console.log(`Found ${nearbyResults.length} hospitals within 5km`);
          allResults = [...nearbyResults];
        }

        const textRequest = {
          query: 'hospital',
          location: new window.google.maps.LatLng(
            request.location.lat,
            request.location.lng
          ),
          radius: 8000,
        };

        placesService.textSearch(textRequest, (textResults, textStatus) => {
          if (!isMounted) return;

          if (textStatus === window.google.maps.places.PlacesServiceStatus.OK && textResults) {
            console.log(`Found ${textResults.length} hospitals from text search`);
            
            textResults.forEach(textPlace => {
              if (!allResults.some(p => p.place_id === textPlace.place_id)) {
                allResults.push(textPlace);
              }
            });
          }

          if (allResults.length === 0) {
            console.log("No hospitals found");
            setOtherHospitals([]);
            setPlacesLoaded(true);
            return;
          }

          console.log(`Total unique hospitals: ${allResults.length}`);

          // Filter valid hospitals
          const valid = allResults.filter((place) => {
            if (!place.geometry?.location) return false;
            
            const name = place.name?.toLowerCase() || '';
            const types = place.types || [];
            
            const isHospital = 
              types.includes('hospital') || 
              name.includes('hospital') ||
              name.includes('nursing home') ||
              name.includes('medical center');
            
            const isExcluded = 
              types.includes('pharmacy') ||
              name.includes('pharmacy') ||
              name.includes('medical store') ||
              name.includes('general store') ||
              name.includes('clinic');
            
            return isHospital && !isExcluded;
          });

          if (!valid.length) {
            console.log("No valid hospitals after filtering");
            setOtherHospitals([]);
            setPlacesLoaded(true);
            return;
          }

          console.log(`Found ${valid.length} valid hospitals`);

          // Calculate distances
          const placesWithDistance = valid.map(place => {
            const placeLat = place.geometry!.location!.lat();
            const placeLng = place.geometry!.location!.lng();
            
            const distance = calculateDistance(
              request.location.lat,
              request.location.lng,
              placeLat,
              placeLng
            );
            
            return {
              ...place,
              approxDistance: distance,
              approxDistanceText: `${distance.toFixed(1)} km`
            };
          });

          placesWithDistance.sort((a, b) => a.approxDistance - b.approxDistance);

          // Get accurate driving distances for top results
          const matrix = new window.google.maps.DistanceMatrixService();
          const topPlaces = placesWithDistance.slice(0, 12);

          matrix.getDistanceMatrix(
            {
              origins: [
                new window.google.maps.LatLng(
                  request.location.lat,
                  request.location.lng
                ),
              ],
              destinations: topPlaces.map((place) => place.geometry!.location!),
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (matrixResponse, matrixStatus) => {
              if (!isMounted) return;

              if (matrixStatus !== "OK" || !matrixResponse?.rows?.length) {
                setOtherHospitals(placesWithDistance.slice(0, 12));
                setPlacesLoaded(true);
                return;
              }

              const enriched = topPlaces
                .map((place, index) => {
                  const element = matrixResponse.rows[0].elements[index];
                  return {
                    ...place,
                    distanceText: element?.distance?.text || place.approxDistanceText,
                    durationText: element?.duration?.text || "Time unknown",
                    durationValue: element?.duration?.value || (place.approxDistance * 120 * 1000),
                  };
                })
                .sort((a, b) => (a.durationValue || Infinity) - (b.durationValue || Infinity))
                .slice(0, 12);

              console.log("Final Google hospitals:", enriched.length);
              setOtherHospitals(enriched);
              setPlacesLoaded(true);
            }
          );
        });
      });
    };

    setPlacesLoaded(false);
    setOtherHospitals([]);
    searchGoogleHospitals();

    return () => {
      isMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [request?.location?.lat, request?.location?.lng]);

  // Reset pagination
  useEffect(() => {
    setGooglePage(0);
  }, [otherHospitals]);

  useEffect(() => {
    setPage(0);
  }, [nearbyHospitals]);

  const totalGooglePages = Math.ceil(otherHospitals.length / GOOGLE_PER_PAGE);
  const googleVisible = otherHospitals.slice(
    googlePage * GOOGLE_PER_PAGE,
    googlePage * GOOGLE_PER_PAGE + GOOGLE_PER_PAGE
  );

  const totalPages = Math.ceil(nearbyHospitals.length / ITEMS_PER_PAGE);
  const start = page * ITEMS_PER_PAGE;
  const currentHospitals = nearbyHospitals.slice(start, start + ITEMS_PER_PAGE);

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

  const handleNavigate = (hospital: Hospital) => {
    if (!request) return;
    const origin = `${request.location.lat},${request.location.lng}`;
    const destination = `${hospital.location.lat},${hospital.location.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const handleGoogleNavigate = (place: any) => {
    if (!place.geometry?.location) return;
    
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    
    if (lat && lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, "_blank");
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
            patientLocation={request.location}
            userLocation={assignedAmbulance?.location}
            ambulances={assignedAmbulance ? [assignedAmbulance] : []}
            destination={request.location}
            showRoute={!!assignedAmbulance}
            hospitals={nearbyHospitals}
            className="h-96 w-full"
          />
          
          {/* Debug info - remove in production */}
          <div className="bg-black bg-opacity-75 text-white text-xs p-2 flex gap-4">
            <span>Registered Hospitals: {nearbyHospitals.length}</span>
            <span>Google Hospitals: {otherHospitals.length}</span>
            <span>Ambulance Assigned: {assignedAmbulance ? 'Yes' : 'No'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Request Details</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600">Phone:</span>
                <span className="ml-2 font-medium">{request.patientPhone || 'Not provided'}</span>
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
                  {request.priority?.toUpperCase() || 'N/A'}
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
                    {assignedAmbulance.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
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

        {/* Registered Nearby Hospitals */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Registered Nearby Hospitals
          </h2>

          {registeredHospitalsError && (
            <div className="text-red-500 text-center py-2 mb-4 bg-red-50 rounded">
              Error: {registeredHospitalsError}
            </div>
          )}

          {nearbyHospitals.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              {registeredHospitalsError ? 'Failed to load hospitals' : 'No registered hospitals found nearby'}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentHospitals.map((hospital) => {
                  const beds = hospital.beds || { icu: 0, oxygen: 0, general: 0 };
                  
                  return (
                    <div
                      key={hospital.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">
                            {hospital.name || 'Unknown Hospital'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {hospital.address || 'Address not available'}
                          </p>
                          <div className="mt-1">
                            <Phone className="h-4 w-4 inline mr-2 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {hospital.phone || 'Phone not available'}
                            </span>
                          </div>
                          {hospital.distanceText && (
                            <p className="text-xs text-gray-500 mt-1">
                              🚗 {hospital.distanceText} • {hospital.durationText || 'Time unknown'}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleNavigate(hospital)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition ml-2"
                          title="Navigate to hospital"
                        >
                          <Navigation className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-red-50 rounded">
                          <div className="font-medium text-red-800">
                            {beds.icu || 0}
                          </div>
                          <div className="text-red-600">ICU</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="font-medium text-blue-800">
                            {beds.oxygen || 0}
                          </div>
                          <div className="text-blue-600">Oxygen</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="font-medium text-green-800">
                            {beds.general || 0}
                          </div>
                          <div className="text-green-600">General</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-6">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page + 1} / {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Other Nearby Hospitals (Google) */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Other Nearby Hospitals
          </h2>

          {!placesLoaded && (
            <div className="text-gray-500 text-center py-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mr-2"></div>
              Searching for nearby hospitals...
            </div>
          )}

          {placesLoaded && otherHospitals.length === 0 && (
            <div className="text-gray-500 text-center py-4">
              No other hospitals found nearby
            </div>
          )}

          {otherHospitals.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {googleVisible.map((place) => {
                  const name = place.name || '';
                  const address = place.vicinity || place.formatted_address || '';
                  const rating = place.rating;
                  const totalRatings = place.user_ratings_total;
                  const distanceText = place.distanceText;
                  const durationText = place.durationText;
                  
                  return (
                    <div
                      key={place.place_id || Math.random().toString()}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">
                            {name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {address}
                          </p>
                          {(distanceText || rating) && (
                            <p className="text-xs text-gray-500 mt-1">
                              {distanceText && (
                                <>📍 {distanceText} • {durationText}</>
                              )}
                              {distanceText && rating && " • "}
                              {rating && <>⭐ {rating} {totalRatings ? `(${totalRatings})` : ''}</>}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleGoogleNavigate(place)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition ml-2"
                          title="Navigate to hospital"
                        >
                          <Navigation className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="mt-3 text-xs bg-gray-100 p-2 rounded">
                        Contact hospital directly for bed availability
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalGooglePages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-6">
                  <button
                    disabled={googlePage === 0}
                    onClick={() => setGooglePage((p) => p - 1)}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {googlePage + 1} / {totalGooglePages}
                  </span>
                  <button
                    disabled={googlePage === totalGooglePages - 1}
                    onClick={() => setGooglePage((p) => p + 1)}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};