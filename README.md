# SwasthSuraksha - Emergency Ambulance Dispatch Platform

A comprehensive, real-time emergency ambulance dispatch system built with React, Firebase, and Google Maps API.

## Features

### 🚨 Emergency Request System
- **SMS-initiated requests**: Users receive SMS links to start emergency requests
- **Automatic location capture**: GPS location automatically detected and captured
- **Real-time tracking**: Live ambulance location and ETA updates
- **Hospital bed availability**: Shows nearby hospitals with live bed counts

### 🚑 Driver Dashboard
- **Real-time location sharing**: Continuous GPS tracking when online
- **Request management**: Accept and manage emergency assignments
- **Navigation integration**: Direct integration with Google Maps for navigation
- **Status management**: Online/offline status control

### 🏥 Hospital Management
- **Bed availability updates**: Real-time ICU, Oxygen, and General bed management
- **Live dashboard**: Easy-to-use interface for hospital staff
- **Automatic integration**: Bed counts automatically shared with dispatch system

### 🤖 Intelligent Dispatch
- **Smart ambulance assignment**: AI-powered selection based on distance and traffic
- **Traffic-aware routing**: Real-time traffic consideration for optimal dispatch
- **Priority-based queuing**: High, medium, and low priority emergency handling
- **Geofencing capabilities**: Location-based triggers and monitoring

## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Firebase (Firestore, Cloud Functions, Authentication)
- **Maps**: Google Maps Platform API
- **Real-time**: Firebase Realtime Database
- **Deployment**: Firebase Hosting

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Firestore and Authentication enabled
- Google Maps Platform API key with Maps JavaScript API enabled
- Twilio account for SMS functionality (optional)

### Installation

1. **Clone and install dependencies**
   ```bash
   # After downloading the project files
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Firebase and Google Maps API credentials in `.env`

3. **Update Firebase project ID**
   Edit `.firebaserc` and replace `REPLACE_WITH_YOUR_ACTUAL_PROJECT_ID` with your Firebase project ID

4. **Start development server**
   ```bash
   npm run dev
   ```

### Firebase Setup

1. **Create Firestore collections**:
   - `ambulances` - Store ambulance data and real-time locations
   - `hospitals` - Hospital information and bed availability
   - `emergency_requests` - Emergency request tracking
   - `drivers` - Driver authentication and details

2. **Deploy Cloud Functions** (for intelligent dispatch):
   ```bash
   firebase deploy --only functions
   ```

## Usage

### For Emergency Users
1. Visit `/emergency` or click SMS link
2. Allow location access
3. Fill emergency details
4. Track ambulance in real-time

### For Ambulance Drivers
1. Visit `/driver/{driverId}/{ambulanceId}`
2. Toggle online status
3. Accept emergency requests
4. Navigate to patient location
5. Complete emergency

### For Hospital Staff
1. Visit `/hospital/{hospitalId}`
2. Update bed availability in real-time
3. Monitor hospital statistics

## API Integration

### Google Maps Platform APIs Used
- **Maps JavaScript API**: Interactive maps and markers
- **Directions API**: Route calculation and navigation
- **Distance Matrix API**: Travel time estimation
- **Places API**: Location search and geocoding

### Firebase Services
- **Firestore**: Real-time database for all application data
- **Cloud Functions**: Serverless backend logic for dispatch
- **Authentication**: Secure user authentication
- **Hosting**: Static site hosting

## Architecture

### Real-time Data Flow
1. **Emergency Request**: User creates request → Firestore trigger
2. **Smart Dispatch**: Cloud Function finds optimal ambulance
3. **Assignment**: Ambulance and request status updated
4. **Tracking**: Real-time location updates via Firestore
5. **Completion**: Status updates and cleanup

### Geofencing Implementation
- **Location monitoring**: Continuous GPS tracking for drivers
- **Boundary detection**: Virtual fences around hospitals and service areas
- **Automatic triggers**: Status updates when entering/exiting zones
- **Predictive routing**: AI-powered route optimization

### Security Features
- **Location privacy**: Encrypted location data transmission
- **Authentication**: Secure driver and hospital authentication
- **Data validation**: Input sanitization and validation
- **Rate limiting**: API call rate limiting and abuse prevention

## Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Environment Configuration
Ensure all environment variables are properly configured in your hosting environment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**SwasthSuraksha** - Saving lives through intelligent emergency response technology.