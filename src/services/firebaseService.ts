import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Ambulance, Hospital, EmergencyRequest } from '../types';

// Ambulance services
export const ambulanceService = {
  async getAll(): Promise<Ambulance[]> {
    const querySnapshot = await getDocs(collection(db, 'ambulances'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated?.toDate(),
    })) as Ambulance[];
  },

  async getAvailable(): Promise<Ambulance[]> {
    const q = query(
      collection(db, 'ambulances'),
      where('status', '==', 'available')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated?.toDate(),
    })) as Ambulance[];
  },

  async getById(id: string): Promise<Ambulance | null> {
    const docRef = doc(db, 'ambulances', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        lastUpdated: docSnap.data().lastUpdated?.toDate(),
      } as Ambulance;
    }
    return null;
  },

  async updateLocation(id: string, location: { lat: number; lng: number }) {
    const docRef = doc(db, 'ambulances', id);
    await updateDoc(docRef, {
      location,
      lastUpdated: Timestamp.now(),
    });
  },

  async updateStatus(id: string, status: Ambulance['status']) {
    const docRef = doc(db, 'ambulances', id);
    await updateDoc(docRef, {
      status,
      lastUpdated: Timestamp.now(),
    });
  },

  subscribeToAvailable(callback: (ambulances: Ambulance[]) => void) {
    const q = query(
      collection(db, 'ambulances'),
      where('status', '==', 'available')
    );
    return onSnapshot(q, (querySnapshot) => {
      const ambulances = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate(),
      })) as Ambulance[];
      callback(ambulances);
    });
  },

  subscribeToAmbulance(id: string, callback: (ambulance: Ambulance | null) => void) {
    const docRef = doc(db, 'ambulances', id);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const ambulance = {
          id: doc.id,
          ...doc.data(),
          lastUpdated: doc.data().lastUpdated?.toDate(),
        } as Ambulance;
        callback(ambulance);
      } else {
        callback(null);
      }
    });
  },
};

// Hospital services
export const hospitalService = {
  async getAll(): Promise<Hospital[]> {
    const querySnapshot = await getDocs(collection(db, 'hospitals'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated?.toDate(),
    })) as Hospital[];
  },

  async updateBeds(id: string, beds: Hospital['beds']) {
    const docRef = doc(db, 'hospitals', id);
    await updateDoc(docRef, {
      beds,
      lastUpdated: Timestamp.now(),
    });
  },

  subscribeToAll(callback: (hospitals: Hospital[]) => void) {
    return onSnapshot(collection(db, 'hospitals'), (querySnapshot) => {
      const hospitals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate(),
      })) as Hospital[];
      callback(hospitals);
    });
  },
};

// Emergency request services
export const emergencyService = {
  async create(request: Omit<EmergencyRequest, 'id' | 'createdAt'>): Promise<string> {
    console.log('Creating emergency request:', request);
    
    const docRef = await addDoc(collection(db, 'emergency_requests'), {
      ...request,
      createdAt: Timestamp.now(),
    });
    
    console.log('Emergency request created with ID:', docRef.id);
    
    // Trigger ambulance assignment after creating request
    setTimeout(() => {
      this.assignNearestAmbulance(docRef.id);
    }, 2000); // Increased delay to ensure request is fully saved
    
    return docRef.id;
  },

  async assignNearestAmbulance(requestId: string) {
    try {
      console.log('Attempting to assign ambulance for request:', requestId);
      
      const request = await this.getById(requestId);
      if (!request || request.status !== 'pending') {
        console.log('Request not found or not pending:', request?.status);
        return;
      }

      console.log('Found request:', request);

      // Get all available ambulances
      const availableAmbulances = await ambulanceService.getAvailable();
      console.log('Available ambulances:', availableAmbulances.length);
      
      if (availableAmbulances.length === 0) {
        console.log('No available ambulances found');
        return;
      }

      // Find nearest ambulance
      let nearestAmbulance = availableAmbulances[0];
      let minDistance = this.calculateDistance(request.location, nearestAmbulance.location);

      for (const ambulance of availableAmbulances) {
        const distance = this.calculateDistance(request.location, ambulance.location);
        console.log(`Distance to ambulance ${ambulance.id}: ${distance.toFixed(2)}km`);
        if (distance < minDistance) {
          minDistance = distance;
          nearestAmbulance = ambulance;
        }
      }

      console.log('Nearest ambulance:', nearestAmbulance.id, 'Distance:', minDistance.toFixed(2), 'km');

      // Calculate ETA (rough estimate: distance * 2 minutes per km)
      const etaMinutes = Math.max(5, Math.round(minDistance * 2));
      const estimatedArrival = new Date(Date.now() + etaMinutes * 60000);

      // Assign ambulance to request
      await this.updateRequest(requestId, {
        status: 'assigned',
        assignedAmbulanceId: nearestAmbulance.id,
        estimatedArrival: estimatedArrival,
      });

      // Update ambulance status
      await ambulanceService.updateStatus(nearestAmbulance.id, 'on_trip');

      console.log(`Successfully assigned ambulance ${nearestAmbulance.id} to request ${requestId}`);
      console.log(`ETA: ${etaMinutes} minutes`);
    } catch (error) {
      console.error('Error assigning ambulance:', error);
    }
  },

  calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) *
        Math.cos(this.toRadians(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  },

  async updateRequest(id: string, updates: Partial<EmergencyRequest>) {
    const docRef = doc(db, 'emergency_requests', id);
    const updateData: any = { ...updates };
    
    if (updates.estimatedArrival) {
      updateData.estimatedArrival = Timestamp.fromDate(updates.estimatedArrival);
    }
    
    await updateDoc(docRef, updateData);
    console.log('Updated request:', id, updates);
  },

  async getById(id: string): Promise<EmergencyRequest | null> {
    const docRef = doc(db, 'emergency_requests', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        estimatedArrival: docSnap.data().estimatedArrival?.toDate(),
      } as EmergencyRequest;
    }
    return null;
  },

  async updateStatus(id: string, status: EmergencyRequest['status']) {
    const docRef = doc(db, 'emergency_requests', id);
    await updateDoc(docRef, { status });
  },

  subscribeToRequest(id: string, callback: (request: EmergencyRequest | null) => void) {
    const docRef = doc(db, 'emergency_requests', id);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const request = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          estimatedArrival: doc.data().estimatedArrival?.toDate(),
        } as EmergencyRequest;
        callback(request);
      } else {
        callback(null);
      }
    });
  },

  // Subscribe to pending requests for drivers
  subscribeToPendingRequests(callback: (requests: EmergencyRequest[]) => void) {
    const q = query(
      collection(db, 'emergency_requests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        estimatedArrival: doc.data().estimatedArrival?.toDate(),
      })) as EmergencyRequest[];
      
      console.log('Pending requests updated:', requests.length);
      callback(requests);
    });
  },

  // Subscribe to requests assigned to specific ambulance
  subscribeToAmbulanceRequests(ambulanceId: string, callback: (requests: EmergencyRequest[]) => void) {
    const q = query(
      collection(db, 'emergency_requests'),
      where('assignedAmbulanceId', '==', ambulanceId),
      where('status', 'in', ['assigned', 'en_route'])
    );

    return onSnapshot(q, (querySnapshot) => {
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        estimatedArrival: doc.data().estimatedArrival?.toDate(),
      })) as EmergencyRequest[];
      
      console.log('Ambulance requests updated:', requests.length);
      callback(requests);
    });
  },
};