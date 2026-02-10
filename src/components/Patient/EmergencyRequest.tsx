import React, { useState } from 'react';
import { Phone, MapPin, AlertTriangle, User, Heart, Car, Zap } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { emergencyService } from '../../services/firebaseService';
import { EmergencyRequest as EmergencyRequestType } from '../../types';

interface EmergencyRequestProps {
  onRequestCreated: (requestId: string) => void;
}

export const EmergencyRequest: React.FC<EmergencyRequestProps> = ({
  onRequestCreated,
}) => {
  const [patientName, setPatientName] = useState('');
  const [emergencyType, setEmergencyType] = useState<EmergencyRequestType['emergencyType']>('other');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { location, error: locationError, loading: locationLoading } = useGeolocation();

  const emergencyTypes = [
    { 
      value: 'cardiac', 
      label: 'Heart Emergency', 
      icon: Heart, 
      color: 'bg-red-100 border-red-300 text-red-800',
      activeColor: 'bg-red-200 border-red-500'
    },
    { 
      value: 'accident', 
      label: 'Accident/Injury', 
      icon: Car, 
      color: 'bg-orange-100 border-orange-300 text-orange-800',
      activeColor: 'bg-orange-200 border-orange-500'
    },
    { 
      value: 'respiratory', 
      label: 'Breathing Problem', 
      icon: Zap, 
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      activeColor: 'bg-blue-200 border-blue-500'
    },
    { 
      value: 'other', 
      label: 'Other Emergency', 
      icon: AlertTriangle, 
      color: 'bg-purple-100 border-purple-300 text-purple-800',
      activeColor: 'bg-purple-200 border-purple-500'
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      alert('Location is required for emergency dispatch');
      return;
    }

    if (!patientName.trim()) {
      alert('Patient name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestId = await emergencyService.create({
        location,
        status: 'pending',
        patientPhone: '', // Not required anymore
        patientName: patientName.trim(),
        emergencyType,
        priority: 'high', // Default to high priority for all emergencies
      });

      onRequestCreated(requestId);
    } catch (error) {
      console.error('Error creating emergency request:', error);
      alert('Failed to create emergency request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (locationLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Getting Your Location</h3>
        <p className="text-sm text-gray-600 mb-4">Please allow location access for emergency dispatch</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <p className="text-sm text-blue-800 font-medium mb-2">Having trouble?</p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Click "Allow" when prompted</li>
            <li>• Check location services are enabled</li>
            <li>• Try refreshing if it takes too long</li>
          </ul>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Location Required</h3>
        <p className="text-sm text-gray-600 mb-4">{locationError}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry Location Access
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="h-4 w-4 inline mr-1" />
          Patient Name *
        </label>
        <input
          type="text"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
          placeholder="Enter patient name"
          required
        />
      </div>

      {/* Emergency Type - Mobile Optimized */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Emergency Type *
        </label>
        <div className="grid grid-cols-1 gap-3">
          {emergencyTypes.map((type) => {
            const IconComponent = type.icon;
            const isSelected = emergencyType === type.value;
            return (
              <label
                key={type.value}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected ? type.activeColor : `${type.color} hover:bg-opacity-50`
                }`}
              >
                <input
                  type="radio"
                  name="emergencyType"
                  value={type.value}
                  checked={isSelected}
                  onChange={(e) => setEmergencyType(e.target.value as EmergencyRequestType['emergencyType'])}
                  className="sr-only"
                />
                <IconComponent className="h-6 w-6 mr-3 flex-shrink-0" />
                <span className="font-medium text-base">{type.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Location Confirmation */}
      {location && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center text-green-800 mb-2">
            <MapPin className="h-5 w-5 mr-2" />
            <span className="font-medium">Location Confirmed</span>
          </div>
          <p className="text-sm text-green-700">
            Emergency services will be dispatched to your current location
          </p>
        </div>
      )}

      {/* Submit Button - Mobile Optimized */}
      <button
        type="submit"
        disabled={isSubmitting || !location}
        className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Dispatching Ambulance...
          </>
        ) : (
          <>
            <Phone className="h-5 w-5 mr-2" />
            Request Emergency Ambulance
          </>
        )}
      </button>

      {/* Emergency Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Emergency Service</p>
            <p>
              For life-threatening situations, also call 108/102. 
              Ambulance dispatch depends on availability.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
};