import { useEffect, useState } from "react";
import PropTypes from "prop-types";

// ── Weather location ─────────────────────────────────────────────────────────
// Open-Meteo only needs coordinates and returns JSON with no API key, which is
// what makes it usable from a greeter. Override the defaults at build time with
// VITE_WEATHER_LAT / VITE_WEATHER_LON / VITE_WEATHER_PLACE.
const WEATHER_LAT = Number(import.meta.env.VITE_WEATHER_LAT ?? -33.4489);
const WEATHER_LON = Number(import.meta.env.VITE_WEATHER_LON ?? -70.6693);
const WEATHER_PLACE = import.meta.env.VITE_WEATHER_PLACE ?? "Santiago de Chile";
const WEATHER_REFRESH_MS = 15 * 60 * 1000;

const DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});

/** WMO weather code → short Spanish label + icon family. */
function describeWeather(code) {
  if (code === 0) return { label: "despejado", family: "sun" };
  if (code === 1 || code === 2) return { label: "parcial", family: "partly" };
  if (code === 3) return { label: "nublado", family: "cloud" };
  if (code === 45 || code === 48) return { label: "niebla", family: "fog" };
  if (code >= 51 && code <= 57) return { label: "llovizna", family: "rain" };
  if (code >= 61 && code <= 67) return { label: "lluvia", family: "rain" };
  if (code >= 71 && code <= 77) return { label: "nieve", family: "snow" };
  if (code >= 80 && code <= 82) return { label: "chaparrones", family: "rain" };
  if (code >= 85 && code <= 86) return { label: "nieve", family: "snow" };
  if (code >= 95) return { label: "tormenta", family: "storm" };
  return { label: "—", family: "cloud" };
}

function WeatherIcon({ family }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (family === "sun") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }

  if (family === "partly") {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="3" />
        <path d="M8 2v1.6M8 12.4V14M2 8h1.6M12.4 8H14M3.8 3.8l1.1 1.1M11.1 11.1l1.1 1.1" />
        <path d="M7 18.5a3.5 3.5 0 0 1 .9-6.9 4.5 4.5 0 0 1 8.6 1.3A2.8 2.8 0 0 1 16.5 18.5Z" />
      </svg>
    );
  }

  if (family === "rain") {
    return (
      <svg {...common}>
        <path d="M6.5 15a4 4 0 0 1 .8-7.9 5 5 0 0 1 9.6 1.5A3.2 3.2 0 0 1 16.5 15Z" />
        <path d="M8 18.5l-.8 2M12 18.5l-.8 2M16 18.5l-.8 2" />
      </svg>
    );
  }

  if (family === "snow") {
    return (
      <svg {...common}>
        <path d="M6.5 14.5a4 4 0 0 1 .8-7.9 5 5 0 0 1 9.6 1.5A3.2 3.2 0 0 1 16.5 14.5Z" />
        <path d="M8 18v1.6M12 18v1.6M16 18v1.6" />
      </svg>
    );
  }

  if (family === "storm") {
    return (
      <svg {...common}>
        <path d="M6.5 14.5a4 4 0 0 1 .8-7.9 5 5 0 0 1 9.6 1.5A3.2 3.2 0 0 1 16.5 14.5Z" />
        <path d="M12 15.5l-2 3.5h2.5l-1.5 3" />
      </svg>
    );
  }

  if (family === "fog") {
    return (
      <svg {...common}>
        <path d="M6 10.5a4 4 0 0 1 .8-7.4 5 5 0 0 1 9.6 1.4A3.2 3.2 0 0 1 16 10.5Z" />
        <path d="M4 14h16M6 17.5h12M8 21h8" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M6.5 17a4 4 0 0 1 .8-7.9 5 5 0 0 1 9.6 1.5A3.2 3.2 0 0 1 16.5 17Z" />
    </svg>
  );
}

WeatherIcon.propTypes = {
  family: PropTypes.oneOf(["sun", "partly", "cloud", "rain", "snow", "storm", "fog"]),
};

/**
 * Compact clock + date + weather tile.
 *
 * Rendered as a CSS-3D panel: the face is rotated in perspective, the numbers
 * pop on the Z axis and a darker slab sits behind it to fake thickness. No
 * extra WebGL context — this lives inside the DOM overlay on top of the scene.
 */
export function ClockWeatherWidget() {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    const load = async () => {
      try {
        const url =
          "https://api.open-meteo.com/v1/forecast" +
          `?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}` +
          "&current=temperature_2m,weather_code&timezone=auto";
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`weather ${res.status}`);
        const data = await res.json();
        if (!alive) return;
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
        });
      } catch {
        // Offline (common right before the greeter's network is up): keep the
        // last reading, or the placeholder if there was never one.
      }
    };

    load();
    const id = setInterval(load, WEATHER_REFRESH_MS);
    return () => {
      alive = false;
      controller.abort();
      clearInterval(id);
    };
  }, []);

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const dateLabel = DATE_FORMAT.format(now).replace(/\./g, "");
  const weatherInfo = weather ? describeWeather(weather.code) : null;
  const tempLabel = weather ? `${weather.temp}°` : "--°";

  return (
    <div
      className="sddm-clock"
      role="group"
      aria-label="Reloj, fecha y clima"
      title={`${WEATHER_PLACE}${weatherInfo ? ` · ${weatherInfo.label}` : ""}`}
    >
      <div className="sddm-clock__edge" aria-hidden="true" />
      <div className="sddm-clock__face">
        <div className="sddm-clock__time">
          {hours}
          <span className="sddm-clock__colon">:</span>
          {minutes}
        </div>
        <div className="sddm-clock__meta">
          <span className="sddm-clock__date">{dateLabel}</span>
          <span className="sddm-clock__weather">
            <span className="sddm-clock__icon">
              <WeatherIcon family={weatherInfo?.family ?? "cloud"} />
            </span>
            <span className="sddm-clock__temp">{tempLabel}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
