"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rideFare = void 0;
const rideFare = (distanceInKm) => {
    const baseFare = 13; // e.g. in dollars
    const perKmRate = 5;
    const distance = parseFloat(distanceInKm.toFixed(1));
    return (baseFare + distance * perKmRate).toFixed(2);
};
exports.rideFare = rideFare;
