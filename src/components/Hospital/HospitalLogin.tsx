import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Key, MapPin, Phone, Navigation } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

export const HospitalLogin: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState<{lat: number; lng: number; address: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login existing hospital
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const hospitalId = userCredential.user.uid;
        
        // Check if hospital profile exists
        const hospitalDoc = await getDoc(doc(db, 'hospitals', hospitalId));
        if (hospitalDoc.exists()) {
          navigate(`/hospital/dashboard/${hospitalId}`);
        } else {
          alert('Hospital profile not found. Please register first.');
        }
      } else {
        // Register new hospital
        if (!location) {
          alert('Please get your location first');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const hospitalId = userCredential.user.uid;

        // Create hospital profile with location data
        await setDoc(doc(db, 'hospitals', hospitalId), {
          name: hospitalName,
          email,
          address,
          phone,
          location: {
            lat: location.lat,
            lng: location.lng,
            address: location.address
          },
          beds: {
            icu: 0,
            oxygen: 0,
            general: 0,
          },
          lastUpdated: new Date(),
          createdAt: new Date(),
        });

        navigate(`/hospital/dashboard/${hospitalId}`);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      alert(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Get address from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          setLocation({
            lat: latitude,
            lng: longitude,
            address: data.display_name || 'Location detected'
          });
          
          // Also set the address field if it's empty
          if (!address) {
            setAddress(data.display_name || '');
          }
        } catch (error) {
          console.error('Error getting address:', error);
          setLocation({
            lat: latitude,
            lng: longitude,
            address: `${latitude}, ${longitude}`
          });
        }
        
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please try again or enter address manually.');
        setGettingLocation(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4">
            <Building2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Hospital Portal</h1>
          <p className="text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Register your hospital'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital Name
                </label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+91 9876543210"
                  required
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Location
                </label>
                
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="w-full mb-3 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  <Navigation className="h-5 w-5 mr-2" />
                  {gettingLocation ? 'Getting Location...' : 'Get Current Location'}
                </button>

                {location && (
                  <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Location Detected</p>
                        <p className="text-sm text-green-700 mt-1">{location.address}</p>
                        <p className="text-xs text-green-600 mt-1">
                          Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!location && (
                  <p className="text-xs text-gray-500 mt-2">
                    Click the button above to automatically detect your hospital's location
                  </p>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || (!isLogin && !location)}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isLogin ? 'Signing In...' : 'Registering...'}
              </div>
            ) : (
              isLogin ? 'Sign In' : 'Register Hospital'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-2" />
            SwasthSuraksha Hospital Portal
          </div>
        </div>
      </div>
    </div>
  );
};