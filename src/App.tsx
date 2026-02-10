import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { PatientDashboard } from './components/Patient/PatientDashboard';
import { ConfirmEmergency } from './components/Patient/ConfirmEmergency'; // Add this import
import { EmergencyTracking } from './components/Patient/EmergencyTracking';
import { DriverDashboard } from './components/Driver/DriverDashboard';
import { HospitalDashboard } from './components/Hospital/HospitalDashboard';
import { DriverLogin } from './components/Driver/DriverLogin';
import { HospitalLogin } from './components/Hospital/HospitalLogin';

function EmergencyTrackingWrapper() {
  const { requestId } = useParams<{ requestId: string }>();
  return requestId ? <EmergencyTracking requestId={requestId} /> : null;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Patient Portal */}
        <Route path="/" element={<PatientDashboard />} />
        <Route path="/emergency" element={<PatientDashboard />} />
        
        {/* SMS Link Route (NEW) */}
        <Route path="/confirm/:token" element={<ConfirmEmergency />} />
        
        {/* Emergency Tracking */}
        <Route path="/tracking/:requestId" element={<EmergencyTrackingWrapper />} />
        
        {/* Driver Portal */}
        <Route path="/driver" element={<DriverLogin />} />
        <Route path="/driver/dashboard/:driverId/:ambulanceId" element={<DriverDashboard />} />
        
        {/* Hospital Portal */}
        <Route path="/hospital" element={<HospitalLogin />} />
        <Route path="/hospital/dashboard/:hospitalId" element={<HospitalDashboard />} />
        
        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;