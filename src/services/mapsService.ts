import { Location } from '../types';

export class MapsService {
  private directionsService: google.maps.DirectionsService;
  private distanceMatrixService: google.maps.DistanceMatrixService;

  constructor() {
    this.directionsService = new google.maps.DirectionsService();
    this.distanceMatrixService = new google.maps.DistanceMatrixService();
  }

  async calculateRoute(
    origin: Location,
    destination: Location
  ): Promise<google.maps.DirectionsResult> {
    return new Promise((resolve, reject) => {
      this.directionsService.route(
        {
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          travelMode: google.maps.TravelMode.DRIVING,
          avoidHighways: false,
          avoidTolls: false,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        }
      );
    });
  }

  async calculateDistanceMatrix(
    origins: Location[],
    destinations: Location[]
  ): Promise<google.maps.DistanceMatrixResponse> {
    return new Promise((resolve, reject) => {
      this.distanceMatrixService.getDistanceMatrix(
        {
          origins: origins.map(loc => new google.maps.LatLng(loc.lat, loc.lng)),
          destinations: destinations.map(loc => new google.maps.LatLng(loc.lat, loc.lng)),
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false,
        },
        (response, status) => {
          if (status === google.maps.DistanceMatrixStatus.OK && response) {
            resolve(response);
          } else {
            reject(new Error(`Distance matrix request failed: ${status}`));
          }
        }
      );
    });
  }

  calculateDistance(point1: Location, point2: Location): number {
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
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  isWithinGeofence(
    userLocation: Location,
    center: Location,
    radiusKm: number
  ): boolean {
    const distance = this.calculateDistance(userLocation, center);
    return distance <= radiusKm;
  }
}