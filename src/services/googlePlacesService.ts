const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface GoogleHospital {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
}

export const googlePlacesService = {
  async getNearbyHospitals(
    lat: number,
    lng: number,
  ): Promise<GoogleHospital[]> {
    const radius = 10000;


    const res = await fetch(
      `http://localhost:3000/api/nearby-hospitals?lat=${lat}&lng=${lng}`
    );


    const data = await res.json();
    console.log("GOOGLE API RESPONSE:", data);   // 👈 ADD HERE

    if (!data.results) return [];

    return data.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
    }));
  },
};
