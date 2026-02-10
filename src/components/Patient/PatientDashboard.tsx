import React, { useState } from 'react';
import { Phone, MapPin, AlertTriangle, Ambulance, Clock } from 'lucide-react';
import { EmergencyRequest } from './EmergencyRequest';
import { EmergencyTracking } from './EmergencyTracking';

export const PatientDashboard: React.FC = () => {
  const [requestId, setRequestId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
      {/* Mobile-optimized Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                <Ambulance className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-800">SwasthSuraksha</h1>
                <p className="text-xs md:text-sm text-gray-600">Emergency Medical Response</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs md:text-sm text-green-600 font-medium">24/7 Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 md:py-6">
        {!requestId ? (
          <div className="max-w-md mx-auto">
            {/* Emergency Header */}
            <div className="text-center mb-6">
              <div className="bg-red-100 rounded-full p-4 w-16 h-16 md:w-20 md:h-20 mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 md:h-12 md:w-12 text-red-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Medical Emergency</h2>
              <p className="text-sm md:text-base text-gray-600">Get immediate ambulance dispatch</p>
            </div>

            {/* Emergency Request Form */}
            <EmergencyRequest onRequestCreated={(id) => setRequestId(id)} />

            {/* Emergency Tips - Mobile Optimized */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h3 className="text-base font-semibold text-blue-800 mb-3">Emergency Tips</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <Clock className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-800">Stay Calm</p>
                    <p className="text-blue-600">Keep patient comfortable and conscious</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-800">Keep Phone Ready</p>
                    <p className="text-blue-600">Ambulance crew may call for directions</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-800">Clear Access</p>
                    <p className="text-blue-600">Ensure clear path for ambulance arrival</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <EmergencyTracking requestId={requestId} />
          </div>
        )}
      </div>
    </div>
  );
};