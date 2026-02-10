import React, { useState, useEffect } from 'react';
import { Building2, Bed, Users, Activity, Save, Plus, Minus, TrendingUp, Clock, MapPin } from 'lucide-react';
import { GoogleMap } from '../Map/GoogleMap';
import { hospitalService } from '../../services/firebaseService';
import { Hospital } from '../../types';

interface HospitalDashboardProps {
  hospitalId?: string;
}

export const HospitalDashboard: React.FC<HospitalDashboardProps> = ({
  hospitalId = window.location.pathname.split('/')[3],
}) => {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [bedCounts, setBedCounts] = useState({
    icu: 0,
    oxygen: 0,
    general: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    // Fetch hospital details
    hospitalService.getAll().then((hospitals) => {
      const currentHospital = hospitals.find(h => h.id === hospitalId);
      if (currentHospital) {
        setHospital(currentHospital);
        setBedCounts(currentHospital.beds);
      }
    });
  }, [hospitalId]);

  const handleSaveBedCounts = async () => {
    if (!hospital) return;

    setIsSaving(true);
    try {
      await hospitalService.updateBeds(hospital.id, bedCounts);
      setLastSaved(new Date());
      
      // Update local hospital state
      setHospital({
        ...hospital,
        beds: bedCounts,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Error updating bed counts:', error);
      alert('Failed to update bed counts. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBedCountChange = (type: keyof typeof bedCounts, value: number) => {
    setBedCounts(prev => ({
      ...prev,
      [type]: Math.max(0, value), // Ensure non-negative values
    }));
  };

  if (!hospital) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-2 mr-3">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{hospital.name}</h1>
                <p className="text-sm text-gray-600">{hospital.address}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {lastSaved && (
                <div className="text-right">
                  <div className="text-sm text-green-600 font-medium">✓ Saved</div>
                  <div className="text-xs text-gray-500">{lastSaved.toLocaleTimeString()}</div>
                </div>
              )}
              <div className="bg-blue-100 rounded-full p-2">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Beds</p>
                <p className="text-2xl font-bold text-gray-800">
                  {bedCounts.icu + bedCounts.oxygen + bedCounts.general}
                </p>
              </div>
              <div className="p-3 rounded-full bg-gray-100">
                <Bed className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ICU Beds</p>
                <p className="text-2xl font-bold text-red-600">{bedCounts.icu}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <Activity className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Oxygen Beds</p>
                <p className="text-2xl font-bold text-blue-600">{bedCounts.oxygen}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">General Beds</p>
                <p className="text-2xl font-bold text-green-600">{bedCounts.general}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Bed className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Hospital Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Hospital Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital Name
              </label>
              <p className="text-gray-900 font-semibold">{hospital.name}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <p className="text-gray-900 font-semibold">{hospital.phone}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Status
              </label>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-green-600 font-semibold">Active & Available</span>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <p className="text-gray-900">{hospital.address}</p>
          </div>
        </div>

        {/* Bed Management */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Bed className="h-6 w-6 mr-2" />
              Real-Time Bed Management
            </h2>
            <button
              onClick={handleSaveBedCounts}
              disabled={isSaving}
              className="flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-lg"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Updating...' : 'Update Bed Counts'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ICU Beds */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-red-200 rounded-full p-2 mr-3">
                    <Activity className="h-6 w-6 text-red-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-800 text-lg">ICU Beds</h3>
                    <p className="text-red-600 text-sm">Intensive Care Unit</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-red-800">
                  {bedCounts.icu}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => handleBedCountChange('icu', bedCounts.icu - 1)}
                    className="bg-red-200 hover:bg-red-300 text-red-800 w-12 h-12 rounded-full transition-colors flex items-center justify-center font-bold text-xl"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <input
                    type="number"
                    value={bedCounts.icu}
                    onChange={(e) => handleBedCountChange('icu', parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border-2 border-red-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    min="0"
                  />
                  <button
                    onClick={() => handleBedCountChange('icu', bedCounts.icu + 1)}
                    className="bg-red-200 hover:bg-red-300 text-red-800 w-12 h-12 rounded-full transition-colors flex items-center justify-center font-bold text-xl"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="text-center">
                  <span className="text-red-700 text-sm font-medium">Available Now</span>
                </div>
              </div>
            </div>

            {/* Oxygen Beds */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-blue-200 rounded-full p-2 mr-3">
                    <Users className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-800 text-lg">Oxygen Beds</h3>
                    <p className="text-blue-600 text-sm">Oxygen Support</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-800">
                  {bedCounts.oxygen}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => handleBedCountChange('oxygen', bedCounts.oxygen - 1)}
                    className="bg-blue-200 hover:bg-blue-300 text-blue-800 w-12 h-12 rounded-full transition-colors flex items-center justify-center font-bold text-xl"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <input
                    type="number"
                    value={bedCounts.oxygen}
                    onChange={(e) => handleBedCountChange('oxygen', parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border-2 border-blue-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                  <button
                    onClick={() => handleBedCountChange('oxygen', bedCounts.oxygen + 1)}
                    className="bg-blue-200 hover:bg-blue-300 text-blue-800 w-12 h-12 rounded-full transition-colors flex items-center justify-center font-bold text-xl"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="text-center">
                  <span className="text-blue-700 text-sm font-medium">Available Now</span>
                </div>
              </div>
            </div>

            {/* General Beds */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-green-200 rounded-full p-2 mr-3">
                    <Bed className="h-6 w-6 text-green-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-800 text-lg">General Beds</h3>
                    <p className="text-green-600 text-sm">General Ward</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-800">
                  {bedCounts.general}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => handleBedCountChange('general', bedCounts.general - 1)}
                    className="bg-green-200 hover:bg-green-300 text-green-800 w-12 h-12 rounded-full transition-colors flex items-center justify-center font-bold text-xl"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <input
                    type="number"
                    value={bedCounts.general}
                    onChange={(e) => handleBedCountChange('general', parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border-2 border-green-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="0"
                  />
                  <button
                    onClick={() => handleBedCountChange('general', bedCounts.general + 1)}
                    className="bg-green-200 hover:bg-green-300 text-green-800 w-12 h-12 rounded-full transition-colors flex items-center justify-center font-bold text-xl"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="text-center">
                  <span className="text-green-700 text-sm font-medium">Available Now</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="bg-yellow-200 rounded-full p-2 mr-3">
                <TrendingUp className="h-5 w-5 text-yellow-700" />
              </div>
              <div>
                <h4 className="font-bold text-yellow-800 mb-2">Real-Time Bed Management Guidelines</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
                  <div>
                    <p className="font-medium mb-1">• Update immediately when beds become available</p>
                    <p className="font-medium mb-1">• Reflect only beds ready for immediate patient admission</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">• Changes are instantly shared with emergency dispatch</p>
                    <p className="font-medium mb-1">• Accurate counts help save critical response time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Today's Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {bedCounts.icu + bedCounts.oxygen + bedCounts.general}
              </div>
              <div className="text-sm text-gray-600">Total Available</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{bedCounts.icu}</div>
              <div className="text-sm text-gray-600">ICU Ready</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{bedCounts.oxygen}</div>
              <div className="text-sm text-gray-600">Oxygen Ready</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{bedCounts.general}</div>
              <div className="text-sm text-gray-600">General Ready</div>
            </div>
          </div>
        </div>

        {/* Hospital Location Map */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Hospital Location
          </h3>
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <GoogleMap
              center={hospital.location}
              hospitals={[hospital]}
              zoom={15}
              className="h-64 w-full"
            />
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Hospital Coordinates</p>
                <p className="text-sm text-blue-600">
                  Lat: {hospital.location.lat.toFixed(6)}, Lng: {hospital.location.lng.toFixed(6)}
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-600 font-medium">Visible to Emergency Services</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};