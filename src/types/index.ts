export interface Location {
  lat: number;
  lng: number;
}

export interface Ambulance {
  distance: any;
  id: string;
  status: 'available' | 'on_trip' | 'offline';
  type: 'basic' | 'advanced' | 'icu';
  location: Location;
  driverId: string;
  driverName: string;
  vehicleNumber: string;
  lastUpdated: Date;
}

export interface Hospital {
  distance: any;
  id: string;
  name: string;
  location: Location;
  address: string;
  phone: string;
  beds: {
    icu: number;
    oxygen: number;
    general: number;
  };
  lastUpdated: Date;
}

export interface EmergencyRequest {
  id: string;
  location: Location;
  status: 'pending' | 'assigned' | 'en_route' | 'completed' | 'cancelled';
  assignedAmbulanceId?: string;
  patientPhone: string;
  patientName?: string;
  emergencyType: 'cardiac' | 'accident' | 'respiratory' | 'other';
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  estimatedArrival?: Date;
  notes?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  ambulanceId: string;
  status: 'active' | 'inactive';
}