import React, { useState, useEffect } from 'react';
import { 
  Building2, Bed, Users, Activity, Save, Plus, TrendingUp, MapPin,
   CheckCircle, XCircle, Printer,
   BarChart3, UserCheck, ClipboardList, DownloadCloud,
  DoorOpen, Hash, UserPlus, Users2
} from 'lucide-react';
import { GoogleMap } from '../Map/GoogleMap';
import { hospitalService } from '../../services/firebaseService';
import { Hospital } from '../../types';

// Enhanced BedAllocation interface with bed and room numbers
interface BedAllocation {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: 'male' | 'female' | 'other';
  bedType: 'icu' | 'oxygen' | 'general';
  bedNumber: string; // Simple number like "101", "203", etc.
  roomNumber: string;
  admissionDate: Date;
  estimatedDischarge: Date;
  doctorName: string;
  condition: 'critical' | 'stable' | 'recovering';
  oxygenRequired: boolean;
  ventilatorRequired: boolean;
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
}

// Visitor interface
interface Visitor {
  id: string;
  patientId: string;
  patientName: string;
  visitorName: string;
  visitorPhone: string;
  relation: string;
  visitDate: Date;
  checkInTime: Date;
  checkOutTime?: Date;
  idProof?: string;
  purpose: 'general' | 'medical' | 'emergency';
  numberOfVisitors: number;
  status: 'checked-in' | 'checked-out';
}

interface DailyStats {
  date: Date;
  admissions: number;
  discharges: number;
  transfers: number;
  occupancyRate: number;
  averageStay: number;
  visitorsCount: number;
}

interface HospitalDashboardProps {
  hospitalId?: string;
}

export const HospitalDashboard: React.FC<HospitalDashboardProps> = ({
  hospitalId = window.location.pathname.split('/')[3],
}) => {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [bedCounts, setBedCounts] = useState({
    icu: { total: 0, available: 0, occupied: 0, maintenance: 0 },
    oxygen: { total: 0, available: 0, occupied: 0, maintenance: 0 },
    general: { total: 0, available: 0, occupied: 0, maintenance: 0 },
  });
  const [allocations, setAllocations] = useState<BedAllocation[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [selectedPatientVisitors, setSelectedPatientVisitors] = useState<Visitor[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [showVisitorForm, setShowVisitorForm] = useState(false);
  const [showVisitorsList, setShowVisitorsList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bedNumberError, setBedNumberError] = useState<string>('');
  const [roomNumberError, setRoomNumberError] = useState<string>('');
  const [newAllocation, setNewAllocation] = useState<Partial<BedAllocation>>({
    bedType: 'general',
    condition: 'stable',
    admissionDate: new Date(),
    emergencyContact: { name: '', relation: '', phone: '' },
    bedNumber: '',
    roomNumber: ''
  });
  const [newVisitor, setNewVisitor] = useState<Partial<Visitor>>({
    purpose: 'general',
    numberOfVisitors: 1,
    status: 'checked-in'
  });

  useEffect(() => {
    // Fetch hospital details
    hospitalService.getAll().then((hospitals) => {
      const currentHospital = hospitals.find(h => h.id === hospitalId);
      if (currentHospital) {
        setHospital(currentHospital);
        // Initialize bed counts with total from hospital
        setBedCounts({
          icu: { total: currentHospital.beds.icu, available: currentHospital.beds.icu, occupied: 0, maintenance: 0 },
          oxygen: { total: currentHospital.beds.oxygen, available: currentHospital.beds.oxygen, occupied: 0, maintenance: 0 },
          general: { total: currentHospital.beds.general, available: currentHospital.beds.general, occupied: 0, maintenance: 0 },
        });
      }
    });

    // Load mock allocations with bed numbers
    loadMockAllocations();
    loadMockVisitors();
    loadDailyStats();
  }, [hospitalId]);

  const loadMockAllocations = () => {
    const mockAllocations: BedAllocation[] = [
      {
        id: '1',
        patientName: 'Ramesh Kumar',
        patientAge: 65,
        patientGender: 'male',
        bedType: 'icu',
        bedNumber: '101',
        roomNumber: '201',
        admissionDate: new Date(2024, 0, 15),
        estimatedDischarge: new Date(2024, 0, 20),
        doctorName: 'Dr. Sharma',
        condition: 'critical',
        oxygenRequired: true,
        ventilatorRequired: true,
        emergencyContact: {
          name: 'Suresh Kumar',
          relation: 'Son',
          phone: '+91 9876543210'
        }
      },
      {
        id: '2',
        patientName: 'Sunita Patel',
        patientAge: 45,
        patientGender: 'female',
        bedType: 'oxygen',
        bedNumber: '203',
        roomNumber: '305',
        admissionDate: new Date(2024, 0, 16),
        estimatedDischarge: new Date(2024, 0, 19),
        doctorName: 'Dr. Verma',
        condition: 'stable',
        oxygenRequired: true,
        ventilatorRequired: false,
        emergencyContact: {
          name: 'Raj Patel',
          relation: 'Husband',
          phone: '+91 9876543211'
        }
      },
      {
        id: '3',
        patientName: 'Ajay Singh',
        patientAge: 30,
        patientGender: 'male',
        bedType: 'general',
        bedNumber: '45',
        roomNumber: '112',
        admissionDate: new Date(2024, 0, 17),
        estimatedDischarge: new Date(2024, 0, 18),
        doctorName: 'Dr. Gupta',
        condition: 'recovering',
        oxygenRequired: false,
        ventilatorRequired: false,
        emergencyContact: {
          name: 'Priya Singh',
          relation: 'Wife',
          phone: '+91 9876543212'
        }
      },
    ];
    setAllocations(mockAllocations);
    updateOccupancyFromAllocations(mockAllocations);
  };

  const loadMockVisitors = () => {
    const mockVisitors: Visitor[] = [
      {
        id: 'v1',
        patientId: '1',
        patientName: 'Ramesh Kumar',
        visitorName: 'Suresh Kumar',
        visitorPhone: '+91 9876543210',
        relation: 'Son',
        visitDate: new Date(),
        checkInTime: new Date(),
        purpose: 'medical',
        numberOfVisitors: 1,
        status: 'checked-in',
        idProof: 'Aadhar: 1234-5678-9012'
      },
      {
        id: 'v2',
        patientId: '2',
        patientName: 'Sunita Patel',
        visitorName: 'Raj Patel',
        visitorPhone: '+91 9876543211',
        relation: 'Husband',
        visitDate: new Date(),
        checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        purpose: 'general',
        numberOfVisitors: 2,
        status: 'checked-out',
        idProof: 'DL: RJ14-2024-00123'
      }
    ];
    setVisitors(mockVisitors);
  };

  const loadDailyStats = () => {
    const mockStats: DailyStats[] = [
      { date: new Date(2024, 0, 15), admissions: 5, discharges: 3, transfers: 1, occupancyRate: 78, averageStay: 4.2, visitorsCount: 12 },
      { date: new Date(2024, 0, 16), admissions: 7, discharges: 4, transfers: 2, occupancyRate: 82, averageStay: 4.5, visitorsCount: 15 },
      { date: new Date(2024, 0, 17), admissions: 4, discharges: 6, transfers: 0, occupancyRate: 75, averageStay: 4.0, visitorsCount: 8 },
    ];
    setDailyStats(mockStats);
  };

  const updateOccupancyFromAllocations = (allocs: BedAllocation[]) => {
    setBedCounts(prev => {
      const icuOccupied = allocs.filter(a => a.bedType === 'icu').length;
      const oxygenOccupied = allocs.filter(a => a.bedType === 'oxygen').length;
      const generalOccupied = allocs.filter(a => a.bedType === 'general').length;

      return {
        icu: {
          ...prev.icu,
          occupied: icuOccupied,
          available: Math.max(0, prev.icu.total - icuOccupied - prev.icu.maintenance),
        },
        oxygen: {
          ...prev.oxygen,
          occupied: oxygenOccupied,
          available: Math.max(0, prev.oxygen.total - oxygenOccupied - prev.oxygen.maintenance),
        },
        general: {
          ...prev.general,
          occupied: generalOccupied,
          available: Math.max(0, prev.general.total - generalOccupied - prev.general.maintenance),
        },
      };
    });
  };

  const validateBedNumber = (bedNumber: string, bedType: string): boolean => {
    // Simple validation: just check if it's a number (can be 1-3 digits)
    const pattern = /^\d{1,3}$/;
    
    if (!pattern.test(bedNumber)) {
      setBedNumberError('Bed number must be a number (1-3 digits)');
      return false;
    }
    
    // Check if bed number is already occupied for this bed type
    const isOccupied = allocations.some(a => a.bedNumber === bedNumber && a.bedType === bedType);
    if (isOccupied) {
      setBedNumberError(`Bed number ${bedNumber} is already occupied for ${bedType} beds`);
      return false;
    }
    
    setBedNumberError('');
    return true;
  };

  const validateRoomNumber = (roomNumber: string): boolean => {
    // Check if room number follows format (1-3 digits)
    const pattern = /^\d{1,3}$/;
    
    if (!pattern.test(roomNumber)) {
      setRoomNumberError('Room number must be a number (1-3 digits)');
      return false;
    }
    
    setRoomNumberError('');
    return true;
  };

  const prefillBedNumber = () => {
    if (!newAllocation.bedType) return;
    
    // Find the next available bed number for the selected bed type
    const existingNumbers = allocations
      .filter(a => a.bedType === newAllocation.bedType)
      .map(a => parseInt(a.bedNumber, 10))
      .filter(num => !isNaN(num));
    
    let nextNumber = 1;
    while (existingNumbers.includes(nextNumber)) {
      nextNumber++;
    }
    
    setNewAllocation({...newAllocation, bedNumber: nextNumber.toString()});
    
    // Validate the suggested bed number
    validateBedNumber(nextNumber.toString(), newAllocation.bedType);
  };

  const handleBedCountUpdate = (type: keyof typeof bedCounts, field: 'total' | 'maintenance', value: number) => {
    setBedCounts(prev => {
      const newCounts = {
        ...prev,
        [type]: {
          ...prev[type],
          [field]: Math.max(0, value),
        },
      };
      
      // Recalculate available beds
      newCounts[type].available = Math.max(0, 
        newCounts[type].total - newCounts[type].occupied - newCounts[type].maintenance
      );
      
      return newCounts;
    });
  };

  const handleSaveChanges = async () => {
    if (!hospital) return;

    setIsSaving(true);
    try {
      // Update total beds in hospital
      await hospitalService.updateBeds(hospital.id, {
        icu: bedCounts.icu.total,
        oxygen: bedCounts.oxygen.total,
        general: bedCounts.general.total,
      });
      
      setLastSaved(new Date());
      alert('Bed counts updated successfully!');
    } catch (error) {
      console.error('Error updating bed counts:', error);
      alert('Failed to update bed counts. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAllocateBed = () => {
    // Validate required fields
    if (!newAllocation.patientName) {
      alert('Please enter patient name');
      return;
    }
    
    if (!newAllocation.bedType) {
      alert('Please select bed type');
      return;
    }
    
    if (!newAllocation.bedNumber) {
      alert('Please enter bed number');
      return;
    }
    
    if (!newAllocation.roomNumber) {
      alert('Please enter room number');
      return;
    }

    // Validate bed number format
    const isBedValid = validateBedNumber(newAllocation.bedNumber, newAllocation.bedType);
    if (!isBedValid) {
      alert(bedNumberError || 'Invalid bed number');
      return;
    }

    // Validate room number format
    const isRoomValid = validateRoomNumber(newAllocation.roomNumber);
    if (!isRoomValid) {
      alert(roomNumberError || 'Invalid room number');
      return;
    }

    const allocation: BedAllocation = {
      id: Date.now().toString(),
      patientName: newAllocation.patientName,
      patientAge: newAllocation.patientAge || 0,
      patientGender: newAllocation.patientGender || 'male',
      bedType: newAllocation.bedType as 'icu' | 'oxygen' | 'general',
      bedNumber: newAllocation.bedNumber,
      roomNumber: newAllocation.roomNumber,
      admissionDate: new Date(),
      estimatedDischarge: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      doctorName: newAllocation.doctorName || 'Dr. Assigned',
      condition: newAllocation.condition as 'critical' | 'stable' | 'recovering' || 'stable',
      oxygenRequired: newAllocation.oxygenRequired || false,
      ventilatorRequired: newAllocation.ventilatorRequired || false,
      emergencyContact: newAllocation.emergencyContact
    };

    const updatedAllocations = [...allocations, allocation];
    setAllocations(updatedAllocations);
    updateOccupancyFromAllocations(updatedAllocations);
    setShowAllocationForm(false);
    setNewAllocation({ 
      bedType: 'general', 
      condition: 'stable', 
      admissionDate: new Date(),
      emergencyContact: { name: '', relation: '', phone: '' },
      bedNumber: '',
      roomNumber: ''
    });
    setBedNumberError('');
    setRoomNumberError('');
    
    alert(`Patient admitted successfully!\nBed: ${allocation.bedNumber}, Room: ${allocation.roomNumber}`);
  };

  const handleAddVisitor = () => {
    if (!newVisitor.visitorName || !newVisitor.patientId) {
      alert('Please fill in visitor name and select patient');
      return;
    }

    const patient = allocations.find(p => p.id === newVisitor.patientId);
    
    const visitor: Visitor = {
      id: Date.now().toString(),
      patientId: newVisitor.patientId,
      patientName: patient?.patientName || '',
      visitorName: newVisitor.visitorName,
      visitorPhone: newVisitor.visitorPhone || '',
      relation: newVisitor.relation || 'Other',
      visitDate: new Date(),
      checkInTime: new Date(),
      purpose: newVisitor.purpose as 'general' | 'medical' | 'emergency' || 'general',
      numberOfVisitors: newVisitor.numberOfVisitors || 1,
      idProof: newVisitor.idProof,
      status: 'checked-in'
    };

    setVisitors([...visitors, visitor]);
    setShowVisitorForm(false);
    setNewVisitor({
      purpose: 'general',
      numberOfVisitors: 1,
      status: 'checked-in'
    });
    alert('Visitor checked in successfully!');
  };

  const handleViewVisitors = (patientId: string) => {
    const patientVisitors = visitors.filter(v => v.patientId === patientId);
    setSelectedPatientVisitors(patientVisitors);
    setShowVisitorsList(true);
  };

  const handleCheckOutVisitor = (visitorId: string) => {
    const updatedVisitors = visitors.map(v => 
      v.id === visitorId 
        ? { ...v, status: 'checked-out' as const, checkOutTime: new Date() }
        : v
    );
    setVisitors(updatedVisitors);
    setSelectedPatientVisitors(selectedPatientVisitors.map(v =>
      v.id === visitorId
        ? { ...v, status: 'checked-out', checkOutTime: new Date() }
        : v
    ));
  };

  const handleDischargePatient = (allocationId: string) => {
    const updatedAllocations = allocations.filter(a => a.id !== allocationId);
    setAllocations(updatedAllocations);
    updateOccupancyFromAllocations(updatedAllocations);
  };

  const generateReport = () => {
    const reportData = {
      hospital: hospital?.name,
      date: new Date().toLocaleDateString(),
      bedOccupancy: bedCounts,
      currentPatients: allocations.length,
      dailyStats: dailyStats,
      visitors: visitors.length
    };
    
    const csv = generateCSV(reportData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hospital-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const generateCSV = (data: any): string => {
    let csv = 'SwasthSuraksha Hospital Report\n';
    csv += `Hospital,${data.hospital}\n`;
    csv += `Date,${data.date}\n`;
    csv += `Total Patients,${data.currentPatients}\n`;
    csv += `Total Visitors Today,${data.visitors}\n\n`;
    csv += `Bed Type,Total,Available,Occupied,Maintenance\n`;
    csv += `ICU,${data.bedOccupancy.icu.total},${data.bedOccupancy.icu.available},${data.bedOccupancy.icu.occupied},${data.bedOccupancy.icu.maintenance}\n`;
    csv += `Oxygen,${data.bedOccupancy.oxygen.total},${data.bedOccupancy.oxygen.available},${data.bedOccupancy.oxygen.occupied},${data.bedOccupancy.oxygen.maintenance}\n`;
    csv += `General,${data.bedOccupancy.general.total},${data.bedOccupancy.general.available},${data.bedOccupancy.general.occupied},${data.bedOccupancy.general.maintenance}\n`;
    return csv;
  };

  const getConditionColor = (condition: string) => {
    switch(condition) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'stable': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'recovering': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredAllocations = allocations.filter(a => 
    a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.bedNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBedNumberPlaceholder = () => {
    return "e.g., 1, 101, 205";
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
      <div className="bg-white shadow-lg border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
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
                  <div className="text-sm text-green-600 font-medium flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" /> Last saved
                  </div>
                  <div className="text-xs text-gray-500">{lastSaved.toLocaleTimeString()}</div>
                </div>
              )}
              <button
                onClick={generateReport}
                className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <DownloadCloud className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Enhanced Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Total Capacity */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Capacity</p>
                <p className="text-2xl font-bold text-gray-800">
                  {bedCounts.icu.total + bedCounts.oxygen.total + bedCounts.general.total}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Bed className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Available Now */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Now</p>
                <p className="text-2xl font-bold text-green-600">
                  {bedCounts.icu.available + bedCounts.oxygen.available + bedCounts.general.available}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Occupied */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupied</p>
                <p className="text-2xl font-bold text-red-600">
                  {bedCounts.icu.occupied + bedCounts.oxygen.occupied + bedCounts.general.occupied}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <UserCheck className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Today's Admissions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Admissions</p>
                <p className="text-2xl font-bold text-yellow-600">8</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Active Visitors */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Visitors</p>
                <p className="text-2xl font-bold text-purple-600">
                  {visitors.filter(v => v.status === 'checked-in').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Users2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Occupancy Rate */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {Math.round((allocations.length / (bedCounts.icu.total + bedCounts.oxygen.total + bedCounts.general.total)) * 100)}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-indigo-100">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Bed Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ICU Beds */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="h-6 w-6 text-white mr-2" />
                  <h3 className="text-lg font-bold text-white">ICU Beds</h3>
                </div>
                <span className="bg-white text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {bedCounts.icu.available} Available
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Total Beds</label>
                    <input
                      type="number"
                      value={bedCounts.icu.total}
                      onChange={(e) => handleBedCountUpdate('icu', 'total', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Maintenance</label>
                    <input
                      type="number"
                      value={bedCounts.icu.maintenance}
                      onChange={(e) => handleBedCountUpdate('icu', 'maintenance', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-red-50 p-2 rounded">
                    <span className="font-bold text-red-700">{bedCounts.icu.occupied}</span>
                    <p className="text-gray-600 text-xs">Occupied</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <span className="font-bold text-green-700">{bedCounts.icu.available}</span>
                    <p className="text-gray-600 text-xs">Available</p>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded">
                    <span className="font-bold text-yellow-700">{bedCounts.icu.maintenance}</span>
                    <p className="text-gray-600 text-xs">Maintenance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Oxygen Beds */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-6 w-6 text-white mr-2" />
                  <h3 className="text-lg font-bold text-white">Oxygen Beds</h3>
                </div>
                <span className="bg-white text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {bedCounts.oxygen.available} Available
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Total Beds</label>
                    <input
                      type="number"
                      value={bedCounts.oxygen.total}
                      onChange={(e) => handleBedCountUpdate('oxygen', 'total', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Maintenance</label>
                    <input
                      type="number"
                      value={bedCounts.oxygen.maintenance}
                      onChange={(e) => handleBedCountUpdate('oxygen', 'maintenance', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-blue-50 p-2 rounded">
                    <span className="font-bold text-blue-700">{bedCounts.oxygen.occupied}</span>
                    <p className="text-gray-600 text-xs">Occupied</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <span className="font-bold text-green-700">{bedCounts.oxygen.available}</span>
                    <p className="text-gray-600 text-xs">Available</p>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded">
                    <span className="font-bold text-yellow-700">{bedCounts.oxygen.maintenance}</span>
                    <p className="text-gray-600 text-xs">Maintenance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* General Beds */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bed className="h-6 w-6 text-white mr-2" />
                  <h3 className="text-lg font-bold text-white">General Beds</h3>
                </div>
                <span className="bg-white text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {bedCounts.general.available} Available
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Total Beds</label>
                    <input
                      type="number"
                      value={bedCounts.general.total}
                      onChange={(e) => handleBedCountUpdate('general', 'total', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Maintenance</label>
                    <input
                      type="number"
                      value={bedCounts.general.maintenance}
                      onChange={(e) => handleBedCountUpdate('general', 'maintenance', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-green-50 p-2 rounded">
                    <span className="font-bold text-green-700">{bedCounts.general.occupied}</span>
                    <p className="text-gray-600 text-xs">Occupied</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <span className="font-bold text-green-700">{bedCounts.general.available}</span>
                    <p className="text-gray-600 text-xs">Available</p>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded">
                    <span className="font-bold text-yellow-700">{bedCounts.general.maintenance}</span>
                    <p className="text-gray-600 text-xs">Maintenance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="flex items-center bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-lg"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Updating...' : 'Save Bed Configuration'}
          </button>
        </div>

        {/* Patient Allocation Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <ClipboardList className="h-6 w-6 mr-2" />
              Current Patient Allocations
            </h2>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search by name, bed, room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 w-64"
              />
              <button
                onClick={() => setShowAllocationForm(true)}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Admission
              </button>
            </div>
          </div>

          {/* Enhanced Patient Table with Bed/Room Info */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bed/Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visitors</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAllocations.map((allocation) => (
                  <tr key={allocation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{allocation.patientName}</div>
                        <div className="text-sm text-gray-500">
                          {allocation.patientAge} yrs, {allocation.patientGender}
                        </div>
                        {allocation.emergencyContact && (
                          <div className="text-xs text-gray-400 mt-1">
                            EC: {allocation.emergencyContact.name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 flex items-center">
                          <Hash className="h-3 w-3 mr-1" />
                          Bed: {allocation.bedNumber}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <DoorOpen className="h-3 w-3 mr-1" />
                          Room: {allocation.roomNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        allocation.bedType === 'icu' ? 'bg-red-100 text-red-800' :
                        allocation.bedType === 'oxygen' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {allocation.bedType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {allocation.admissionDate.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {allocation.doctorName}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getConditionColor(allocation.condition)}`}>
                        {allocation.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewVisitors(allocation.id)}
                        className="text-purple-600 hover:text-purple-900 flex items-center"
                      >
                        <Users2 className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {visitors.filter(v => v.patientId === allocation.id && v.status === 'checked-in').length}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setNewVisitor({ ...newVisitor, patientId: allocation.id });
                            setShowVisitorForm(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Add Visitor"
                        >
                          <UserPlus className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDischargePatient(allocation.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Discharge"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Statistics with Visitor Count */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Daily Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {dailyStats.map((stat, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">{stat.date.toLocaleDateString()}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Admissions:</span>
                    <span className="text-sm font-semibold text-green-600">+{stat.admissions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Discharges:</span>
                    <span className="text-sm font-semibold text-blue-600">{stat.discharges}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Visitors:</span>
                    <span className="text-sm font-semibold text-purple-600">{stat.visitorsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Occupancy:</span>
                    <span className="text-sm font-semibold text-indigo-600">{stat.occupancyRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hospital Location Map */}
        <div className="bg-white rounded-xl shadow-lg p-6">
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
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Admission Form Modal - Updated with simple bed numbers */}
      {showAllocationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">New Patient Admission</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Personal Information */}
              <div className="col-span-2">
                <h4 className="font-medium text-gray-700 mb-2">Personal Information</h4>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
                <input
                  type="text"
                  value={newAllocation.patientName || ''}
                  onChange={(e) => setNewAllocation({...newAllocation, patientName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  value={newAllocation.patientAge || ''}
                  onChange={(e) => setNewAllocation({...newAllocation, patientAge: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={newAllocation.patientGender || 'male'}
                  onChange={(e) => setNewAllocation({...newAllocation, patientGender: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Bed Assignment - Updated with simple number format */}
              <div className="col-span-2">
                <h4 className="font-medium text-gray-700 mb-2 mt-2">Bed Assignment</h4>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type *</label>
                <select
                  value={newAllocation.bedType || 'general'}
                  onChange={(e) => {
                    setNewAllocation({...newAllocation, bedType: e.target.value as any, bedNumber: ''});
                    setBedNumberError('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="general">General Ward</option>
                  <option value="oxygen">Oxygen Bed</option>
                  <option value="icu">ICU Bed</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bed Number *</label>
                    <input
                      type="text"
                      value={newAllocation.bedNumber || ''}
                      onChange={(e) => {
                        setNewAllocation({...newAllocation, bedNumber: e.target.value});
                        if (newAllocation.bedType) {
                          validateBedNumber(e.target.value, newAllocation.bedType);
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        bedNumberError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                      }`}
                      placeholder={getBedNumberPlaceholder()}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={prefillBedNumber}
                    disabled={!newAllocation.bedType}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed mb-0.5"
                    title="Suggest next available bed number"
                  >
                    Suggest
                  </button>
                </div>
                {bedNumberError && (
                  <p className="text-xs text-red-600 mt-1">{bedNumberError}</p>
                )}
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
                <input
                  type="text"
                  value={newAllocation.roomNumber || ''}
                  onChange={(e) => {
                    setNewAllocation({...newAllocation, roomNumber: e.target.value});
                    validateRoomNumber(e.target.value);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    roomNumberError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="e.g., 101, 205, 312"
                />
                {roomNumberError && (
                  <p className="text-xs text-red-600 mt-1">{roomNumberError}</p>
                )}
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                <input
                  type="text"
                  value={newAllocation.doctorName || ''}
                  onChange={(e) => setNewAllocation({...newAllocation, doctorName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Attending doctor"
                />
              </div>

              {/* Medical Information */}
              <div className="col-span-2">
                <h4 className="font-medium text-gray-700 mb-2 mt-2">Medical Information</h4>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  value={newAllocation.condition || 'stable'}
                  onChange={(e) => setNewAllocation({...newAllocation, condition: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="stable">Stable</option>
                  <option value="critical">Critical</option>
                  <option value="recovering">Recovering</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-1 flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newAllocation.oxygenRequired || false}
                    onChange={(e) => setNewAllocation({...newAllocation, oxygenRequired: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm">Oxygen Required</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newAllocation.ventilatorRequired || false}
                    onChange={(e) => setNewAllocation({...newAllocation, ventilatorRequired: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm">Ventilator Required</span>
                </label>
              </div>

              {/* Emergency Contact */}
              <div className="col-span-2">
                <h4 className="font-medium text-gray-700 mb-2 mt-2">Emergency Contact</h4>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={newAllocation.emergencyContact?.name || ''}
                  onChange={(e) => setNewAllocation({
                    ...newAllocation, 
                    emergencyContact: { 
                      name: e.target.value, 
                      relation: newAllocation.emergencyContact?.relation || '',
                      phone: newAllocation.emergencyContact?.phone || ''
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                <input
                  type="text"
                  value={newAllocation.emergencyContact?.relation || ''}
                  onChange={(e) => setNewAllocation({
                    ...newAllocation, 
                    emergencyContact: { 
                      name: newAllocation.emergencyContact?.name || '',
                      relation: e.target.value,
                      phone: newAllocation.emergencyContact?.phone || ''
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newAllocation.emergencyContact?.phone || ''}
                  onChange={(e) => setNewAllocation({
                    ...newAllocation, 
                    emergencyContact: { 
                      name: newAllocation.emergencyContact?.name || '',
                      relation: newAllocation.emergencyContact?.relation || '',
                      phone: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAllocationForm(false);
                  setBedNumberError('');
                  setRoomNumberError('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAllocateBed}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Admit Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visitor Form Modal */}
      {showVisitorForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add Visitor</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
                <select
                  value={newVisitor.patientId || ''}
                  onChange={(e) => setNewVisitor({...newVisitor, patientId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Choose patient</option>
                  {allocations.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.patientName} - Bed {patient.bedNumber} (Room {patient.roomNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Name</label>
                <input
                  type="text"
                  value={newVisitor.visitorName || ''}
                  onChange={(e) => setNewVisitor({...newVisitor, visitorName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newVisitor.visitorPhone || ''}
                  onChange={(e) => setNewVisitor({...newVisitor, visitorPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="+91 9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relation to Patient</label>
                <input
                  type="text"
                  value={newVisitor.relation || ''}
                  onChange={(e) => setNewVisitor({...newVisitor, relation: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Spouse, Child, Parent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Visit</label>
                <select
                  value={newVisitor.purpose || 'general'}
                  onChange={(e) => setNewVisitor({...newVisitor, purpose: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="general">General Visit</option>
                  <option value="medical">Medical Discussion</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Visitors</label>
                <input
                  type="number"
                  value={newVisitor.numberOfVisitors || 1}
                  onChange={(e) => setNewVisitor({...newVisitor, numberOfVisitors: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof (Optional)</label>
                <input
                  type="text"
                  value={newVisitor.idProof || ''}
                  onChange={(e) => setNewVisitor({...newVisitor, idProof: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Aadhar, DL, Passport"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowVisitorForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVisitor}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Check In Visitor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visitors List Modal */}
      {showVisitorsList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-lg font-bold mb-4">Patient Visitors</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Visitor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Relation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedPatientVisitors.map((visitor) => (
                    <tr key={visitor.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{visitor.visitorName}</div>
                          <div className="text-sm text-gray-500">{visitor.purpose}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{visitor.visitorPhone}</td>
                      <td className="px-6 py-4">{visitor.relation}</td>
                      <td className="px-6 py-4">
                        {visitor.checkInTime.toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          visitor.status === 'checked-in' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {visitor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {visitor.status === 'checked-in' && (
                          <button
                            onClick={() => handleCheckOutVisitor(visitor.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Check Out
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowVisitorsList(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};