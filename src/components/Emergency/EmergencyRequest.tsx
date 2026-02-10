import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Clock, AlertTriangle } from 'lucide-react';
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
  const [patientPhone, setPatientPhone] = useState('');
  const [emergencyType, setEmergencyType] = useState<EmergencyRequestType['emergencyType']>('other');
  const [priority, setPriority] = useState<EmergencyRequestType['priority']>('medium');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { location, error: locationError, loading: locationLoading } = useGeolocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      alert('Location is required for emergency dispatch');
      return;
    }

    if (!patientPhone.trim()) {
      alert('Phone number is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestId = await emergencyService.create({
        location,
        status: 'pending',
        patientPhone: patientPhone.trim(),
        patientName: patientName.trim() || undefined,
        emergencyType,
        priority,
        notes: notes.trim() || undefined,
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
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Getting Your Location</h2>
          <p className="text-gray-600">Please allow location access for emergency dispatch</p>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Location Required</h2>
          <p className="text-gray-600 mb-4">{locationError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
            <Phone className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Emergency Request</h1>
          <p className="text-gray-600">Fill in the details for immediate ambulance dispatch</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient Phone Number *
            </label>
            <input
              type="tel"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="+91 9876543210"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient Name
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter patient name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Type *
            </label>
            <select
              value={emergencyType}
              onChange={(e) => setEmergencyType(e.target.value as EmergencyRequestType['emergencyType'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="cardiac">Cardiac Emergency</option>
              <option value="accident">Accident</option>
              <option value="respiratory">Respiratory Emergency</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority Level *
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as EmergencyRequestType['priority'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Any additional information..."
            />
          </div>

          {location && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center text-green-800">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Location Confirmed</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !location}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Requesting Ambulance...
              </div>
            ) : (
              'Request Emergency Ambulance'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};