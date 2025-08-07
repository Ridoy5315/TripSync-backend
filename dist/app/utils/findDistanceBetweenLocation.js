"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distanceInKm = void 0;
const distanceInKm = (payload) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const pickupLat = (_b = (_a = payload.pickupLocation) === null || _a === void 0 ? void 0 : _a.coordinates) === null || _b === void 0 ? void 0 : _b[1];
    const pickupLon = (_d = (_c = payload.pickupLocation) === null || _c === void 0 ? void 0 : _c.coordinates) === null || _d === void 0 ? void 0 : _d[0];
    const destLat = (_f = (_e = payload.destinationLocation) === null || _e === void 0 ? void 0 : _e.coordinates) === null || _f === void 0 ? void 0 : _f[1];
    const destLon = (_h = (_g = payload.destinationLocation) === null || _g === void 0 ? void 0 : _g.coordinates) === null || _h === void 0 ? void 0 : _h[0];
    if (typeof pickupLat === "number" &&
        typeof pickupLon === "number" &&
        typeof destLat === "number" &&
        typeof destLon === "number") {
        return getDistanceFromLatLonInKm(pickupLat, pickupLon, destLat, destLon);
    }
    // Return NaN or throw an error if any coordinate is missing
    return NaN;
};
exports.distanceInKm = distanceInKm;
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
