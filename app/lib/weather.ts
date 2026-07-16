import { geocodeZip } from '@/app/lib/geocode';

export type DailyForecast = {
  day: string; // 'Wed'
  hi: number;
  lo: number;
  code: number; // WMO weather code
};

export type WeatherData = {
  placeName: string; // e.g. "Oakland, CA"
  currentTemp: number;
  currentCode: number; // WMO weather code
  isDay: boolean;
  forecast: DailyForecast[]; // next 7 days
  sunrise: string; // '5:59am'
  sunset: string; // '8:30pm'
};

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function weekdayFromDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DAYS_SHORT[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

// Open-Meteo returns wall-clock times for the requested timezone with no
// UTC offset, so parse the "HH:MM" text directly instead of going through
// Date/getHours (which would apply the server's local timezone).
function formatClockTime(isoTime: string): string {
  const timePart = isoTime.split('T')[1] ?? isoTime;
  const [hStr, mStr] = timePart.split(':');
  let h = Number(hStr);
  const suffix = h < 12 ? 'am' : 'pm';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr}${suffix}`;
}

export function weatherLabel(code: number): string {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code === 51 || code === 53 || code === 55) return 'Drizzle';
  if (code === 56 || code === 57) return 'Freezing drizzle';
  if (code === 61 || code === 63 || code === 65) return 'Rain';
  if (code === 66 || code === 67) return 'Freezing rain';
  if (code === 71 || code === 73 || code === 75 || code === 77) return 'Snow';
  if (code === 80 || code === 81 || code === 82) return 'Rain showers';
  if (code === 85 || code === 86) return 'Snow showers';
  if (code === 95 || code === 96 || code === 99) return 'Thunderstorm';
  return 'Unknown';
}

export async function fetchWeather(zip: string): Promise<WeatherData | null> {
  const location = await geocodeZip(zip);
  if (!location) return null;

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(location.latitude));
  url.searchParams.set('longitude', String(location.longitude));
  url.searchParams.set('current', 'temperature_2m,weather_code,is_day');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset');
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '8');

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`Open-Meteo responded with ${res.status}`);
    const data = await res.json();

    const forecast: DailyForecast[] = (data.daily.time as string[]).slice(1, 8).map((dateStr, i) => ({
      day: weekdayFromDateString(dateStr),
      hi: Math.round(data.daily.temperature_2m_max[i + 1]),
      lo: Math.round(data.daily.temperature_2m_min[i + 1]),
      code: data.daily.weather_code[i + 1],
    }));

    return {
      placeName: location.placeName,
      currentTemp: Math.round(data.current.temperature_2m),
      currentCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
      forecast,
      sunrise: formatClockTime(data.daily.sunrise[0]),
      sunset: formatClockTime(data.daily.sunset[0]),
    };
  } catch (err) {
    console.error('Failed to fetch weather:', err);
    return null;
  }
}
