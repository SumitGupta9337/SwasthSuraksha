import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Phone, Navigation, CheckCircle, XCircle, Truck, Activity, User, AlertTriangle, Bell } from 'lucide-react';
import { GoogleMap } from '../Map/GoogleMap';
import { useGeolocation } from '../../hooks/useGeolocation';
import { ambulanceService, emergencyService, hospitalService } from '../../services/firebaseService';
import { Ambulance, EmergencyRequest, Hospital } from '../../types';

interface DriverDashboardProps {
  ambulanceId?: string;
  
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  ambulanceId = window.location.pathname.split('/')[4],
}) => {
  const [ambulance, setAmbulance] = useState<Ambulance | null>(null);
  const [currentRequest, setCurrentRequest] = useState<EmergencyRequest | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<EmergencyRequest[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const { location } = useGeolocation(true);
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);


  useEffect(() => {
    // Fetch ambulance details
    ambulanceService.getById(ambulanceId).then((amb) => {
      if (amb) {
        setAmbulance(amb);
        setIsOnline(amb.status === 'available' || amb.status === 'on_trip');
      }
    });
  }, [ambulanceId]);

  useEffect(() => {
  hospitalService.getAll().then(setNearbyHospitals);
}, []);


  useEffect(() => {
    // Subscribe to ambulance updates
    if (!ambulanceId) return;

    const unsubscribe = ambulanceService.subscribeToAmbulance(ambulanceId, (updatedAmbulance) => {
      if (updatedAmbulance) {
        setAmbulance(updatedAmbulance);
        setIsOnline(updatedAmbulance.status === 'available' || updatedAmbulance.status === 'on_trip');
      }
    });

    return unsubscribe;
  }, [ambulanceId]);

  useEffect(() => {
    // Subscribe to requests assigned to this ambulance
    if (!ambulanceId) return;

    const unsubscribe = emergencyService.subscribeToAmbulanceRequests(ambulanceId, (requests) => {
      if (requests.length > 0) {
        setCurrentRequest(requests[0]);
      } else {
        setCurrentRequest(null);
      }
    });

    return unsubscribe;
  }, [ambulanceId]);

  useEffect(() => {
    // Subscribe to pending requests when online
    if (!isOnline) {
      setPendingRequests([]);
      return;
    }

    console.log('Driver is online, subscribing to pending requests...');

    const unsubscribe = emergencyService.subscribeToPendingRequests((requests) => {
      console.log('Received pending requests:', requests);
      setPendingRequests(requests);
      
      // Show notification for new requests
      if (requests.length > 0 && !currentRequest) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    });

    return unsubscribe;
  }, [isOnline, currentRequest]);

  /* ============================================= */
/* AUTO ASSIGN NEAREST WHEN DRIVER FREE         */
/* ============================================= */
useEffect(() => {
  if (!isOnline) return;
  if (!ambulanceId) return;
  if (!location) return;
  if (currentRequest) return;
  if (!pendingRequests.length) return;

  console.log("Auto assignment check...");

  // pick nearest request
  const nearest = [...pendingRequests].sort((a, b) => {
    const da = emergencyService.calculateDistance(location, a.location);
    const db = emergencyService.calculateDistance(location, b.location);
    return da - db;
  })[0];

  if (!nearest) return;

  console.log("Auto accepting:", nearest.id);

  handleAcceptRequest(nearest.id);

}, [isOnline, pendingRequests, location, currentRequest, ambulanceId]);


  useEffect(() => {
    // Update ambulance location when driver's location changes
    if (location && isOnline && ambulanceId) {
      ambulanceService.updateLocation(ambulanceId, location);
    }
  }, [location, ambulanceId, isOnline]);

  const handleToggleOnline = async () => {
    if (!ambulanceId) return;
    
    const newStatus = isOnline ? 'offline' : 'available';
    await ambulanceService.updateStatus(ambulanceId, newStatus);
    setIsOnline(!isOnline);
    
    if (!isOnline) {
      console.log('Going online - will start receiving requests');
    } else {
      console.log('Going offline - will stop receiving requests');
      setPendingRequests([]);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    console.log('Accepting request:', requestId);
    
    await emergencyService.updateRequest(requestId, {
      status: 'assigned',
      assignedAmbulanceId: ambulanceId,
    });
    
    await ambulanceService.updateStatus(ambulanceId, 'on_trip');
    
    // Clear pending requests
    setPendingRequests([]);
    setShowNotification(false);
  };

  const handleDeclineRequest = async (requestId: string) => {
    console.log('Declining request:', requestId);
    // Remove from local state - in production, you might want to track declined requests
    setPendingRequests(prev => prev.filter(req => req.id !== requestId));
  };

  const handleCompleteRequest = async () => {
    if (currentRequest) {
      await emergencyService.updateRequest(currentRequest.id, { status: 'completed' });
      await ambulanceService.updateStatus(ambulanceId, 'available');
      setCurrentRequest(null);
    }
  };

  const handleStartTrip = async () => {
    if (currentRequest) {
      await emergencyService.updateRequest(currentRequest.id, { status: 'en_route' });
    }
  };

  if (!ambulance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Notification Banner */}
      {showNotification && pendingRequests.length > 0 && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-4 z-50 animate-pulse">
          <div className="flex items-center justify-center">
            <Bell className="h-5 w-5 mr-2" />
            <span className="font-bold">🚨 NEW EMERGENCY REQUEST! Check below to accept.</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-2 mr-3">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Driver Dashboard</h1>
                <p className="text-sm text-gray-600">Vehicle: {ambulance.vehicleNumber} • {ambulance.driverName}</p>
              </div>
            </div>
            <button
              onClick={handleToggleOnline}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center ${
                isOnline
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg'
                  : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-red-200 animate-pulse' : 'bg-green-200'}`}></div>
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className={`text-lg font-bold ${isOnline ? 'text-green-600' : 'text-gray-600'}`}>
                  {isOnline ? 'Online & Available' : 'Offline'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${isOnline ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Activity className={`h-6 w-6 ${isOnline ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vehicle Type</p>
                <p className="text-lg font-bold text-gray-800 capitalize">{ambulance.type} Life Support</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-lg font-bold text-red-600">{pendingRequests.length}</p>
              </div>
              <div className={`p-3 rounded-full ${pendingRequests.length > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <Bell className={`h-6 w-6 ${pendingRequests.length > 0 ? 'text-red-600' : 'text-gray-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Location Status */}
        {location && isOnline && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm font-medium text-green-800">Location Tracking Active</span>
              </div>
              <span className="text-xs text-gray-500">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </span>
            </div>
          </div>
        )}

        {/* Pending Requests */}
        {pendingRequests.length > 0 && !currentRequest && (
          <div className="bg-white rounded-lg shadow-lg border-l-4 border-yellow-500 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Bell className="h-5 w-5 text-yellow-600 mr-2 animate-bounce" />
                New Emergency Requests ({pendingRequests.length})
              </h2>
              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                🚨 URGENT
              </div>
            </div>
            
            <div className="space-y-4">
              {pendingRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="font-semibold text-gray-800 capitalize">
                        {request.emergencyType.replace('_', ' ')} Emergency
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      request.priority === 'high' ? 'bg-red-100 text-red-800' :
                      request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {request.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      {request.patientName && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm font-medium">{request.patientName}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">{request.patientPhone}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">{request.createdAt.toLocaleTimeString()}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm">
                            ~{emergencyService.calculateDistance(location, request.location).toFixed(1)} km away
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Emergency
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(request.id)}
                      className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-semibold flex items-center justify-center"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Request */}
        {currentRequest ? (
          <div className="bg-white rounded-lg shadow-lg border-l-4 border-red-500 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                Active Emergency
              </h2>
              <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                🚨 {currentRequest.status.toUpperCase()}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Patient Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-red-600 mr-2" />
                      <span className="font-medium">{currentRequest.patientPhone}</span>
                    </div>
                    {currentRequest.patientName && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-red-600 mr-2" />
                        <span className="font-medium">{currentRequest.patientName}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-500 mr-3" />
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="ml-2 font-semibold capitalize text-gray-800">{currentRequest.emergencyType.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-500 mr-3" />
                  <span className="text-sm text-gray-600">Priority:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    currentRequest.priority === 'high' ? 'bg-red-100 text-red-800' :
                    currentRequest.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {currentRequest.priority.toUpperCase()}
                  </span>
                </div>
                {location && (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 ml-7">Distance:</span>
                    <span className="ml-2 font-medium">
                      {emergencyService.calculateDistance(location, currentRequest.location).toFixed(1)} km
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${currentRequest.location.lat},${currentRequest.location.lng}`;
                    window.open(url, '_blank');
                  }}
                  className="flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Navigate to Patient
                </button>
                
                {currentRequest.status === 'assigned' && (
                  <button
                    onClick={handleStartTrip}
                    className="flex items-center justify-center bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold shadow-lg"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Start Trip (En Route)
                  </button>
                )}
                
                <button
                  onClick={handleCompleteRequest}
                  className="flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-lg"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Emergency
                </button>
              </div>
            </div>

            {currentRequest.notes && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Notes:</span>
                <p className="text-sm text-gray-600 mt-1">{currentRequest.notes}</p>
              </div>
            )}
          </div>
        ) : !isOnline ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="py-12">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-3">Currently Offline</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                You are currently offline. Click "Go Online" to start receiving emergency requests and help save lives.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="py-12">
              <Activity className="h-16 w-16 text-green-500 mx-auto mb-4 animate-pulse" />
              <h2 className="text-xl font-bold text-gray-800 mb-3">Ready for Emergency Requests</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                You are online and available for emergency dispatch. New requests will appear here automatically.
              </p>
              <div className="mt-4 text-sm text-green-600 font-medium">🟢 Listening for emergency calls...</div>
            </div>
          </div>
        )}

        {/* Map */}
        {/* Map */}
{location && (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <GoogleMap
  center={location}

  // ambulance
  userLocation={location}

  // patient
  patientLocation={currentRequest?.location}

  // hospitals
  hospitals={nearbyHospitals}

  ambulances={[]}

  destination={currentRequest?.location}
  showRoute={!!currentRequest}

  className="h-96 w-full"
/>


  </div>
)}

      </div>
    </div>
  );
};