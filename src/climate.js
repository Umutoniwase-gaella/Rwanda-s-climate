const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";

const MONTH_NAMES = {
  rw: ["Mut", "Gas", "Wer", "Mat", "Gic", "Kam", "Nya", "Kan", "Nze", "Ukw", "Ugu", "Uku"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  fr: ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"]
};

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export async function fetchWeather(lat, lon, signal) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
    timezone: "Africa/Kigali",
    forecast_days: "7"
  });

  const response = await fetch(`${FORECAST_URL}?${params}`, { signal });

  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status})`);
  }

  const data = await response.json();

  return {
    current: data.current,
    daily: data.daily,
    elevation: data.elevation
  };
}

export async function fetchClimate(lat, lon, signal) {
  const end = new Date();
  end.setDate(end.getDate() - 1);

  const start = new Date(end);
  start.setDate(start.getDate() - 364);

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    start_date: formatDate(start),
    end_date: formatDate(end),
    daily: "precipitation_sum,temperature_2m_mean",
    timezone: "Africa/Kigali"
  });

  const response = await fetch(`${ARCHIVE_URL}?${params}`, { signal });

  if (!response.ok) {
    throw new Error(`Climate request failed (${response.status})`);
  }

  const data = await response.json();
  const groups = new Map();

  data.daily.time.forEach((date, index) => {
    const key = date.slice(0, 7);
    const group = groups.get(key) || {
      key,
      rainfall: 0,
      temperatureSum: 0,
      temperatureDays: 0
    };

    const rainfall = data.daily.precipitation_sum[index];
    const temperature = data.daily.temperature_2m_mean[index];

    if (typeof rainfall === "number") {
      group.rainfall += rainfall;
    }

    if (typeof temperature === "number") {
      group.temperatureSum += temperature;
      group.temperatureDays += 1;
    }

    groups.set(key, group);
  });

  const monthly = [...groups.values()].slice(-12).map((group) => ({
    key: group.key,
    month: group.key.slice(5, 7),
    rainfall: Math.round(group.rainfall * 10) / 10,
    temperature: group.temperatureDays
      ? Math.round((group.temperatureSum / group.temperatureDays) * 10) / 10
      : null
  }));

  return { monthly };
}

export function weatherKind(code) {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "showers";
  if (code >= 85 && code <= 86) return "snow";
  if (code >= 95) return "thunder";
  return "cloudy";
}

export function describeWeather(code, labels) {
  const kind = weatherKind(code);
  return labels?.[kind] || labels?.cloudy || "";
}

export function buildAlerts(daily) {
  if (!daily) return [];

  const rain = Math.max(...daily.precipitation_sum.map((value) => value || 0));
  const wind = Math.max(...daily.wind_speed_10m_max.map((value) => value || 0));
  const heat = Math.max(...daily.temperature_2m_max.map((value) => value || 0));

  const alerts = [];

  if (rain >= 40) {
    alerts.push({ kind: "rain", level: rain >= 80 ? "warning" : "advisory", value: Math.round(rain) });
  }

  if (wind >= 30) {
    alerts.push({ kind: "wind", level: wind >= 45 ? "warning" : "watch", value: Math.round(wind) });
  }

  if (heat >= 32) {
    alerts.push({ kind: "heat", level: heat >= 35 ? "warning" : "watch", value: Math.round(heat) });
  }

  return alerts;
}

export function monthLabel(key, language) {
  const month = Number(key.slice(5, 7));
  const names = MONTH_NAMES[language] || MONTH_NAMES.en;
  return names[month - 1] || key;
}

export function rainfallTotals(monthly) {
  if (!monthly || monthly.length === 0) {
    return { total: 0, average: 0, wettest: null, driest: null };
  }

  const total = monthly.reduce((sum, item) => sum + item.rainfall, 0);
  const wettest = monthly.reduce((a, b) => (b.rainfall > a.rainfall ? b : a));
  const driest = monthly.reduce((a, b) => (b.rainfall < a.rainfall ? b : a));

  return {
    total: Math.round(total),
    average: Math.round(total / monthly.length),
    wettest,
    driest
  };
}

export function temperatureTotals(monthly) {
  const values = monthly
    .map((item) => item.temperature)
    .filter((value) => typeof value === "number");

  if (values.length === 0) {
    return { average: null, highest: null, lowest: null };
  }

  return {
    average: Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10,
    highest: Math.max(...values),
    lowest: Math.min(...values)
  };
}

export function buildSeasonTotals(monthly) {
  const seasons = [
    { id: "A", months: [9, 10, 11, 12, 1], value: 0 },
    { id: "B", months: [2, 3, 4, 5], value: 0 },
    { id: "C", months: [6, 7, 8], value: 0 }
  ];

  monthly.forEach((item) => {
    const month = Number(item.month);
    const season = seasons.find((entry) => entry.months.includes(month));
    if (season) {
      season.value += item.rainfall;
    }
  });

  return seasons.map((season) => ({
    id: season.id,
    value: Math.round(season.value)
  }));
}

export function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = value === null || value === undefined ? "" : String(value);
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(",")
    )
    .join("\n");
}
