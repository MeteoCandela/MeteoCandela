// lib/env.js
export function getBase() {
  // Detecta subpath GitHub Pages /MeteoCandela/
  return location.pathname.includes("/MeteoCandela/") ? "/MeteoCandela" : "";
}

export function getApi() {
  const BASE = location.pathname.includes("/MeteoCandela/") ? "/MeteoCandela" : "";
  const API_BASE = `/api`; // <-- IMPORTANT: no depèn de BASE

  return {
    BASE,
    API_BASE,
    HISTORY_URL: `${API_BASE}/history`,
    CURRENT_URL: `${API_BASE}/current`,
    HEARTBEAT_URL: `${API_BASE}/heartbeat`,
    FORECAST_URL: `${API_BASE}/forecast`,
    MUNICIPIS_URL: `${API_BASE}/municipis`,
    DAILY_URL: `${API_BASE}/daily-summary`,
    PUSH_PUBLIC_KEY_URL: `${API_BASE}/push/public-key`,
    PUSH_SUBSCRIBE_URL:  `${API_BASE}/push/subscribe`,
    PUSH_UNSUBSCRIBE_URL:`${API_BASE}/push/unsubscribe`,
  };
}

