import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, MapPin, AlertTriangle, User, CheckCircle } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { emergencyService } from '../../services/firebaseService';

export const ConfirmEmergency: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [patientName, setPatientName] = useState('');
  const [emergencyType, setEmergencyType] = useState<'cardiac' | 'accident' | 'respiratory' | 'other'>('other');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { location, error: locationError, loading: locationLoading } = useGeolocation();

  // Fetch phone number from backend when component loads
  useEffect(() => {
    const fetchPhoneNumber = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/token/${token}`);
        if (!response.ok) {
          throw new Error('Invalid token');
        }
        
        const data = await response.json();
        setPhoneNumber(data.phone);
      } catch (error) {
        console.error('Error fetching phone number:', error);
        alert('This link is invalid or has expired. Please call again.');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhoneNumber();
  }, [token, navigate]);

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
        patientPhone: phoneNumber, // Auto-filled from SMS link
        patientName: patientName.trim(),
        emergencyType,
        priority: 'high',
      });

      // Navigate to tracking page
      navigate(`/tracking/${requestId}`);
    } catch (error) {
      console.error('Error creating emergency request:', error);
      alert('Failed to create emergency request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || locationLoading) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {isLoading ? 'Verifying your phone...' : 'Getting your location...'}
          </h3>
          <p className="text-sm text-gray-600">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="text-center">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirm Emergency Request</h1>
          <p className="text-gray-600">Your phone number has been verified</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Auto-filled Phone Number */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center text-green-800 mb-2">
              <Phone className="h-5 w-5 mr-2" />
              <span className="font-medium">Verified Phone Number</span>
            </div>
            <p className="text-lg font-semibold text-green-700">{phoneNumber}</p>
            <p className="text-xs text-green-600 mt-1">This number was automatically verified from your call</p>
          </div>

          {/* Patient Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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

          {/* Emergency Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Type *
            </label>
            <select
              value={emergencyType}
              onChange={(e) => setEmergencyType(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="cardiac">Heart Emergency</option>
              <option value="accident">Accident/Injury</option>
              <option value="respiratory">Breathing Problem</option>
              <option value="other">Other Emergency</option>
            </select>
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

          {/* Submit Button */}
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
                <AlertTriangle className="h-5 w-5 mr-2" />
                Confirm Emergency Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};