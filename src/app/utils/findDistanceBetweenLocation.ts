import { IRide } from "../modules/rides/rides.interface";

export const distanceInKm = (payload: Partial<IRide>) => {
  const pickupLat = payload.pickupLocation?.coordinates?.[1];
  const pickupLon = payload.pickupLocation?.coordinates?.[0];
  const destLat = payload.destinationLocation?.coordinates?.[1];
  const destLon = payload.destinationLocation?.coordinates?.[0];

  if (
    typeof pickupLat === "number" &&
    typeof pickupLon === "number" &&
    typeof destLat === "number" &&
    typeof destLon === "number"
  ) {
    return getDistanceFromLatLonInKm(pickupLat, pickupLon, destLat, destLon);
  }
  // Return NaN or throw an error if any coordinate is missing
  return NaN;
};



function getDistanceFromLatLonInKm(
  lat1: number ,
  lon1: number ,
  lat2: number ,
  lon2: number 
) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
