import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Phone, Truck, Building2 } from 'lucide-react';
import { GoogleMap } from '../Map/GoogleMap';
import { emergencyService, ambulanceService, hospitalService } from '../../services/firebaseService';
import { EmergencyRequest, Ambulance, Hospital } from '../../types';

interface EmergencyTrackingProps {
  requestId: string;
}

export const EmergencyTracking: React.FC<EmergencyTrackingProps> = ({
  requestId,
}) => {
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [assignedAmbulance, setAssignedAmbulance] = useState<Ambulance | null>(null);
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  

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
    // Fetch nearby hospitals
    hospitalService.getAll().then((hospitals) => {
      if (request) {
        // Sort hospitals by distance (simplified - in production, use proper distance calculation)
        const sorted = hospitals.sort((a, b) => {
          const distA = Math.abs(a.location.lat - request.location.lat) + Math.abs(a.location.lng - request.location.lng);
          const distB = Math.abs(b.location.lat - request.location.lat) + Math.abs(b.location.lng - request.location.lng);
          return distA - distB;
        });
        setNearbyHospitals(sorted.slice(0, 5));
      }
    });
  }, [request]);

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
            userLocation={request.location}
            ambulances={assignedAmbulance ? [assignedAmbulance] : []}
            hospitals={nearbyHospitals}
            selectedAmbulance={assignedAmbulance || undefined}
            showRoute={!!assignedAmbulance}
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
                {request.estimatedArrival && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">
                        ETA: {request.estimatedArrival.toLocaleTimeString()}
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

        {/* Nearby Hospitals */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Nearby Hospitals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyHospitals.map((hospital) => (
              <div key={hospital.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">{hospital.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{hospital.address}</p>
                    <p className="text-sm text-gray-600">{hospital.phone}</p>
                  </div>
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="font-medium text-red-800">{hospital.beds.icu}</div>
                    <div className="text-red-600">ICU</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-medium text-blue-800">{hospital.beds.oxygen}</div>
                    <div className="text-blue-600">Oxygen</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-medium text-green-800">{hospital.beds.general}</div>
                    <div className="text-green-600">General</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

