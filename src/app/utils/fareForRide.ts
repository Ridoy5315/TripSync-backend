

export const rideFare = (distanceInKm : number) => {
  const baseFare = 13; // e.g. in dollars
  const perKmRate = 5;
  const distance = parseFloat(distanceInKm.toFixed(1));

  return (baseFare + distance * perKmRate).toFixed(2);
};
