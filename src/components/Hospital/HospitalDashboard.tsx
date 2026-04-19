import React, { useState, useEffect } from 'react';
import { 
  Building2, Bed, Users, Activity, Save, Plus, TrendingUp, MapPin,
   CheckCircle, XCircle, Printer,
   BarChart3, UserCheck, ClipboardList, DownloadCloud,
  DoorOpen, Hash, UserPlus, Users2
} from 'lucide-react';
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-100 rounded-lg p-2">
                <Building2 className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{hospital.name}</h1>
                <p className="text-sm text-gray-500">{hospital.address}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {lastSaved && (
                <div className="text-right mr-4">
                  <div className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" /> Saved
                  </div>
                  <div className="text-xs text-gray-400">{lastSaved.toLocaleTimeString()}</div>
                </div>
              )}
              <button
                onClick={generateReport}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <DownloadCloud className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Capacity</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {bedCounts.icu.total + bedCounts.oxygen.total + bedCounts.general.total}
                </p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <Bed className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Available Now</p>
                <p className="text-2xl font-semibold text-green-600">
                  {bedCounts.icu.available + bedCounts.oxygen.available + bedCounts.general.available}
                </p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Occupied</p>
                <p className="text-2xl font-semibold text-red-600">
                  {bedCounts.icu.occupied + bedCounts.oxygen.occupied + bedCounts.general.occupied}
                </p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <UserCheck className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Admissions</p>
                <p className="text-2xl font-semibold text-yellow-600">8</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Visitors</p>
                <p className="text-2xl font-semibold text-purple-600">
                  {visitors.filter(v => v.status === 'checked-in').length}
                </p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Users2 className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
                <p className="text-2xl font-semibold text-indigo-600">
                  {Math.round((allocations.length / (bedCounts.icu.total + bedCounts.oxygen.total + bedCounts.general.total)) * 100)}%
                </p>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Bed Management Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ICU Beds */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">ICU Beds</h3>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {bedCounts.icu.available} Available
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Total Beds</label>
                    <input
                      type="number"
                      value={bedCounts.icu.total}
                      onChange={(e) => handleBedCountUpdate('icu', 'total', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Maintenance</label>
                    <input
                      type="number"
                      value={bedCounts.icu.maintenance}
                      onChange={(e) => handleBedCountUpdate('icu', 'maintenance', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-red-50 rounded-md p-2">
                    <span className="block text-sm font-semibold text-red-700">{bedCounts.icu.occupied}</span>
                    <p className="text-xs text-gray-500">Occupied</p>
                  </div>
                  <div className="bg-green-50 rounded-md p-2">
                    <span className="block text-sm font-semibold text-green-700">{bedCounts.icu.available}</span>
                    <p className="text-xs text-gray-500">Available</p>
                  </div>
                  <div className="bg-yellow-50 rounded-md p-2">
                    <span className="block text-sm font-semibold text-yellow-700">{bedCounts.icu.maintenance}</span>
                    <p className="text-xs text-gray-500">Maintenance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Oxygen Beds */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Oxygen Beds</h3>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {bedCounts.oxygen.available} Available
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Total Beds</label>
                    <input
                      type="number"
                      value={bedCounts.oxygen.total}
                      onChange={(e) => handleBedCountUpdate('oxygen', 'total', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Maintenance</label>
                    <input
                      type="number"
                      value={bedCounts.oxygen.maintenance}
                      onChange={(e) => handleBedCountUpdate('oxygen', 'maintenance', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-red-50 rounded-md p-2">
                    <span className="block text-sm font-semibold  text-red-700">{bedCounts.oxygen.occupied}</span>
                    <p className="text-xs text-gray-500">Occupied</p>
                  </div>
                  <div className="bg-green-50 rounded-md p-2">
                    <span className="block text-sm font-semibold text-green-700">{bedCounts.oxygen.available}</span>
                    <p className="text-xs text-gray-500">Available</p>
                  </div>
                  <div className="bg-yellow-50 rounded-md p-2">
                    <span className="block text-sm font-semibold text-yellow-700">{bedCounts.oxygen.maintenance}</span>
                    <p className="text-xs text-gray-500">Maintenance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* General Beds */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bed className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">General Beds</h3>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {bedCounts.general.available} Available
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Total Beds</label>
                    <input
                      type="number"
                      value={bedCounts.general.total}
                      onChange={(e) => handleBedCountUpdate('general', 'total', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Maintenance</label>
                    <input
                      type="number"
                      value={bedCounts.general.maintenance}
                      onChange={(e) => handleBedCountUpdate('general', 'maintenance', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-red-50 rounded-md p-2">
                    <span className="block text-sm font-semibold text-red-700">{bedCounts.general.occupied}</span>
                    <p className="text-xs text-gray-500">Occupied</p>
                  </div>
                  <div className="bg-green-50 rounded-md p-2">
                    <span className="block text-sm font-semibold text-green-700">{bedCounts.general.available}</span>
                    <p className="text-xs text-gray-500">Available</p>
                  </div>
                  <div className="bg-yellow-50 rounded-md p-2">
                    <span className="block text-sm font-semibold text-yellow-700">{bedCounts.general.maintenance}</span>
                    <p className="text-xs text-gray-500">Maintenance</p>
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
            className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Bed Configuration'}
          </button>
        </div>

        {/* Patient Allocations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-base font-semibold text-gray-700 flex items-center">
              <ClipboardList className="h-5 w-5 mr-2 text-gray-500" />
              Current Patient Allocations
            </h2>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
              />
              <button
                onClick={() => setShowAllocationForm(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Admission
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bed / Room</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitors</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAllocations.map((allocation) => (
                  <tr key={allocation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{allocation.patientName}</div>
                      <div className="text-xs text-gray-500">{allocation.patientAge} yrs, {allocation.patientGender}</div>
                      {allocation.emergencyContact && (
                        <div className="text-xs text-gray-400 mt-1">EC: {allocation.emergencyContact.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Hash className="h-3 w-3 mr-1 text-gray-400" />
                        {allocation.bedNumber}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-0.5">
                        <DoorOpen className="h-3 w-3 mr-1 text-gray-400" />
                        {allocation.roomNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        allocation.bedType === 'icu' ? 'bg-red-100 text-red-800' :
                        allocation.bedType === 'oxygen' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {allocation.bedType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {allocation.admissionDate.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {allocation.doctorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConditionColor(allocation.condition)}`}>
                        {allocation.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewVisitors(allocation.id)}
                        className="text-purple-600 hover:text-purple-900 inline-flex items-center text-sm"
                      >
                        <Users2 className="h-4 w-4 mr-1" />
                        {visitors.filter(v => v.patientId === allocation.id && v.status === 'checked-in').length}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
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
      </div>

      {/* New Admission Form Modal */}
      {showAllocationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">New Patient Admission</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Personal Information</h4>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
                  <input
                    type="text"
                    value={newAllocation.patientName || ''}
                    onChange={(e) => setNewAllocation({...newAllocation, patientName: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={newAllocation.patientAge || ''}
                    onChange={(e) => setNewAllocation({...newAllocation, patientAge: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={newAllocation.patientGender || 'male'}
                    onChange={(e) => setNewAllocation({...newAllocation, patientGender: e.target.value as any})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 mt-2">Bed Assignment</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type *</label>
                  <select
                    value={newAllocation.bedType || 'general'}
                    onChange={(e) => {
                      setNewAllocation({...newAllocation, bedType: e.target.value as any, bedNumber: ''});
                      setBedNumberError('');
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="general">General Ward</option>
                    <option value="oxygen">Oxygen Bed</option>
                    <option value="icu">ICU Bed</option>
                  </select>
                </div>
                <div>
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
                        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 ${
                          bedNumberError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder={getBedNumberPlaceholder()}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={prefillBedNumber}
                      disabled={!newAllocation.bedType}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suggest
                    </button>
                  </div>
                  {bedNumberError && <p className="text-xs text-red-600 mt-1">{bedNumberError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
                  <input
                    type="text"
                    value={newAllocation.roomNumber || ''}
                    onChange={(e) => {
                      setNewAllocation({...newAllocation, roomNumber: e.target.value});
                      validateRoomNumber(e.target.value);
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 ${
                      roomNumberError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="e.g., 101, 205"
                  />
                  {roomNumberError && <p className="text-xs text-red-600 mt-1">{roomNumberError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                  <input
                    type="text"
                    value={newAllocation.doctorName || ''}
                    onChange={(e) => setNewAllocation({...newAllocation, doctorName: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Attending doctor"
                  />
                </div>

                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 mt-2">Medical Information</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select
                    value={newAllocation.condition || 'stable'}
                    onChange={(e) => setNewAllocation({...newAllocation, condition: e.target.value as any})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="stable">Stable</option>
                    <option value="critical">Critical</option>
                    <option value="recovering">Recovering</option>
                  </select>
                </div>
                <div className="flex items-center space-x-5">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newAllocation.oxygenRequired || false}
                      onChange={(e) => setNewAllocation({...newAllocation, oxygenRequired: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Oxygen Required</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newAllocation.ventilatorRequired || false}
                      onChange={(e) => setNewAllocation({...newAllocation, ventilatorRequired: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Ventilator Required</span>
                  </label>
                </div>

                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 mt-2">Emergency Contact</h4>
                </div>
                <div>
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAllocationForm(false);
                  setBedNumberError('');
                  setRoomNumberError('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleAllocateBed}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Admit Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visitor Form Modal */}
      {showVisitorForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">Add Visitor</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
                <select
                  value={newVisitor.patientId || ''}
                  onChange={(e) => setNewVisitor({...newVisitor, patientId: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Choose patient</option>
                  {allocations.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.patientName} - Bed {patient.bedNumber}
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newVisitor.visitorPhone || ''}
                  onChange={(e) => setNewVisitor({...newVisitor, visitorPhone: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="+91 9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relation to Patient</label>
                <input
                  type="text"
                  value={newVisitor.relation || ''}
                  onChange={(e) => setNewVisitor({...newVisitor, relation: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Spouse, Child"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Visit</label>
                <select
                  value={newVisitor.purpose || 'general'}
                  onChange={(e) => setNewVisitor({...newVisitor, purpose: e.target.value as any})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof (Optional)</label>
                <input
                  type="text"
                  value={newVisitor.idProof || ''}
                  onChange={(e) => setNewVisitor({...newVisitor, idProof: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Aadhar, DL"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowVisitorForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVisitor}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Check In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visitors List Modal */}
      {showVisitorsList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">Visitors List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedPatientVisitors.map((visitor) => (
                    <tr key={visitor.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{visitor.visitorName}</div>
                        <div className="text-xs text-gray-500">{visitor.purpose}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visitor.visitorPhone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visitor.relation}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {visitor.checkInTime.toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          visitor.status === 'checked-in' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {visitor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {visitor.status === 'checked-in' && (
                          <button
                            onClick={() => handleCheckOutVisitor(visitor.id)}
                            className="text-red-600 hover:text-red-900"
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
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowVisitorsList(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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