import { mapData } from "./mapGeo";

const WIDTH = 600;
const HEIGHT = 600;
const PADDING = 22;

function createProjection() {
  const points = [];

  for (const region of [...mapData.provinces, ...mapData.districts]) {
    for (const ring of region.rings) {
      for (const point of ring) {
        points.push(point);
      }
    }
  }

  const longitudes = points.map((point) => point[0]);
  const latitudes = points.map((point) => point[1]);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const middleLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const lonScale = Math.cos(middleLat);
  const rawWidth = (maxLon - minLon) * lonScale;
  const rawHeight = maxLat - minLat;
  const scale = Math.min(
    (WIDTH - PADDING * 2) / rawWidth,
    (HEIGHT - PADDING * 2) / rawHeight
  );
  const offsetX = (WIDTH - rawWidth * scale) / 2;
  const offsetY = (HEIGHT - rawHeight * scale) / 2;

  return ([lon, lat]) => [
    offsetX + (lon - minLon) * lonScale * scale,
    offsetY + (maxLat - lat) * scale
  ];
}

const project = createProjection();

function toPath(rings) {
  return rings
    .map((ring) => {
      const commands = ring.map((point, index) => {
        const [x, y] = project(point);
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      });
      return `${commands.join(" ")} Z`;
    })
    .join(" ");
}

const provinces = mapData.provinces.map((province) => ({
  name: province.name,
  path: toPath(province.rings)
}));

const districts = mapData.districts.map((district) => {
  const [x, y] = project(district.center);
  return {
    name: district.name,
    path: toPath(district.rings),
    x,
    y
  };
});

const districtsByName = new Map(districts.map((district) => [district.name, district]));

export default function RwandaMap({
  province,
  district,
  onProvince,
  onDistrict
}) {
  const selected = districtsByName.get(district);
  const labelOnLeft = selected ? selected.x > WIDTH * 0.62 : false;

  return (
    <svg
      className="rwanda-map"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Map of Rwanda"
    >
      <g className="map-provinces">
        {provinces.map((item) => (
          <path
            key={item.name}
            d={item.path}
            className={`map-province ${province === item.name ? "active" : ""}`}
            fillRule="evenodd"
            onClick={() => onProvince(item.name)}
          >
            <title>{item.name}</title>
          </path>
        ))}
      </g>

      <g className="map-districts">
        {districts.map((item) => (
          <path
            key={item.name}
            d={item.path}
            className={`map-district ${district === item.name ? "active" : ""}`}
            fillRule="evenodd"
            onClick={() => onDistrict(item.name)}
          >
            <title>{item.name}</title>
          </path>
        ))}
      </g>

      {selected && (
        <g className="map-selected">
          <circle cx={selected.x} cy={selected.y} r={6} />
          <text
            x={selected.x + (labelOnLeft ? -12 : 12)}
            y={selected.y + 4}
            textAnchor={labelOnLeft ? "end" : "start"}
          >
            {selected.name}
          </text>
        </g>
      )}
    </svg>
  );
}
