import mapData from "./data/rwanda-map.json";

export const districtCenters = Object.fromEntries(
  mapData.districts.map((district) => [
    district.name,
    { lat: district.center[1], lon: district.center[0] }
  ])
);

export const provinceCenters = Object.fromEntries(
  mapData.provinces.map((province) => [
    province.name,
    { lat: province.center[1], lon: province.center[0] }
  ])
);

export { mapData };
