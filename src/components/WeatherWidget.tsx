import React, { useCallback, useEffect, useState } from 'react';
import { ThemeConfig } from '../theme';
import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  MapPin,
  RefreshCw,
  Sun,
  Wind,
} from 'lucide-react';

interface WeatherForecastDay {
  dayLabel: string;
  maxTemp: number;
  minTemp: number;
  code: number;
}

interface WeatherData {
  locationName: string;
  temperature: number;
  condition: string;
  code: number;
  humidity: number;
  windKmh: number;
  forecast: WeatherForecastDay[];
  updatedAt: string;
  usingFallbackLocation?: boolean;
}

interface WeatherWidgetProps {
  theme: ThemeConfig;
  onSpeakWeather?: (summary: string) => void;
}

const WEATHER_CACHE_KEY = 'jarvis_weather_cache_v1';

function describeWeatherCode(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code <= 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'Rainy';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'Snow';
  if (code >= 95) return 'Thunderstorm';
  return 'Pleasant';
}

function WeatherIcon({ code, className = 'w-5 h-5' }: { code: number; className?: string }) {
  if (code === 0) return <Sun className={`${className} text-amber-300`} />;
  if (code <= 3 || code === 45 || code === 48) return <Cloud className={`${className} text-slate-300`} />;
  if (code >= 51 && code <= 57) return <CloudDrizzle className={`${className} text-cyan-300`} />;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return <CloudRain className={`${className} text-blue-300`} />;
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return <CloudSnow className={`${className} text-sky-200`} />;
  }
  if (code >= 95) return <CloudLightning className={`${className} text-purple-300`} />;
  return <Sun className={`${className} text-amber-300`} />;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ theme, onSpeakWeather }) => {
  const [weather, setWeather] = useState<WeatherData | null>(() => {
    try {
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchWeatherForCoords = useCallback(
    async (lat: number, lon: number, usingFallbackLocation: boolean) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(
        4
      )}&longitude=${lon.toFixed(
        4
      )}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`;

      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`Weather API error ${resp.status}`);
      }
      const data = await resp.json();

      let locationName = usingFallbackLocation ? 'New Delhi, IN' : 'Your Location';
      if (!usingFallbackLocation) {
        try {
          const geoResp = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          );
          if (geoResp.ok) {
            const geo = await geoResp.json();
            const city = geo.city || geo.locality || geo.principalSubdivision;
            const country = geo.countryCode;
            if (city) {
              locationName = country ? `${city}, ${country}` : city;
            }
          }
        } catch {
          // keep graceful label
        }
      }

      const currentCode = Number(data?.current?.weather_code ?? 0);
      const dates: string[] = data?.daily?.time || [];
      const maxTemps: number[] = data?.daily?.temperature_2m_max || [];
      const minTemps: number[] = data?.daily?.temperature_2m_min || [];
      const codes: number[] = data?.daily?.weather_code || [];

      const forecast: WeatherForecastDay[] = dates.slice(0, 3).map((isoDate, idx) => {
        const label =
          idx === 0
            ? 'Today'
            : idx === 1
            ? 'Tomorrow'
            : new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
        return {
          dayLabel: label,
          maxTemp: Math.round(maxTemps[idx] ?? data?.current?.temperature_2m ?? 28),
          minTemp: Math.round(minTemps[idx] ?? 20),
          code: Number(codes[idx] ?? currentCode),
        };
      });

      const formatted: WeatherData = {
        locationName,
        temperature: Math.round(Number(data?.current?.temperature_2m ?? 28)),
        condition: describeWeatherCode(currentCode),
        code: currentCode,
        humidity: Math.round(Number(data?.current?.relative_humidity_2m ?? 55)),
        windKmh: Math.round(Number(data?.current?.wind_speed_10m ?? 8)),
        forecast,
        updatedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        usingFallbackLocation,
      };

      setWeather(formatted);
      setErrorMsg('');
      try {
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(formatted));
      } catch {
        // ignore storage limits
      }
    },
    []
  );

  const loadWeather = useCallback(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setErrorMsg('Offline — showing saved forecast');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const fallbackToDefault = async () => {
      try {
        await fetchWeatherForCoords(28.6139, 77.209, true);
      } catch {
        setErrorMsg('Weather unavailable offline');
      } finally {
        setLoading(false);
      }
    };

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await fetchWeatherForCoords(pos.coords.latitude, pos.coords.longitude, false);
          } catch {
            await fallbackToDefault();
          } finally {
            setLoading(false);
          }
        },
        () => {
          fallbackToDefault();
        },
        { timeout: 6000, maximumAge: 300000 }
      );
    } else {
      fallbackToDefault();
    }
  }, [fetchWeatherForCoords]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const handleAnnounce = () => {
    if (!weather || !onSpeakWeather) return;
    onSpeakWeather(
      `${weather.locationName} me abhi temperature ${weather.temperature} degree Celsius aur mausam ${weather.condition} hai.`
    );
  };

  return (
    <div
      className={`w-full p-3.5 rounded-2xl bg-slate-900/75 backdrop-blur-xl border ${theme.statusCardBorder} ${theme.statusCardShadow} space-y-2.5 transition-all duration-300`}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleAnnounce}
          className="flex items-center gap-2.5 min-w-0 text-left group"
        >
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0">
            <WeatherIcon code={weather?.code ?? 0} className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-xs text-slate-300 truncate">
              <MapPin className={`w-3 h-3 shrink-0 ${theme.accentText}`} />
              <span className="truncate font-medium">
                {weather ? weather.locationName : loading ? 'Detecting location...' : 'Location unavailable'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold font-mono tabular-nums text-white">
                {weather ? `${weather.temperature}°C` : '--°C'}
              </span>
              <span className="text-xs text-slate-300 truncate">
                {weather ? weather.condition : loading ? 'Loading...' : errorMsg || 'Tap refresh'}
              </span>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={loadWeather}
          disabled={loading}
          aria-label="Refresh weather"
          className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Metrics & 3-Day Simple Forecast */}
      {weather && (
        <>
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span className="flex items-center gap-1 tabular-nums">
              <Droplets className="w-3 h-3 text-cyan-400" />
              {weather.humidity}% humidity
            </span>
            <span className="flex items-center gap-1 tabular-nums">
              <Wind className="w-3 h-3 text-slate-300" />
              {weather.windKmh} km/h
            </span>
            <span className="tabular-nums">Updated {weather.updatedAt}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-0.5">
            {weather.forecast.map((day) => (
              <div
                key={day.dayLabel}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950/65 border border-slate-800/80 flex items-center justify-between gap-1 text-[11px]"
              >
                <div className="min-w-0">
                  <span className="text-slate-300 font-medium block truncate">{day.dayLabel}</span>
                  <span className="text-white font-mono tabular-nums font-semibold">
                    {day.maxTemp}° / {day.minTemp}°
                  </span>
                </div>
                <WeatherIcon code={day.code} className="w-3.5 h-3.5 shrink-0" />
              </div>
            ))}
          </div>
        </>
      )}

      {errorMsg && weather && (
        <p className="text-[10px] text-amber-300/90">{errorMsg}</p>
      )}
    </div>
  );
};
