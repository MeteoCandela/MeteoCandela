// lib/env.js
export function getBase() {
  const host = location.hostname.toLowerCase();

  // Només GitHub Pages té subpath tipus /MeteoCandela
  // En domini propi (meteocandela.cat) SEMPRE volem base="".
  if (host.endsWith("github.io")) {
    // si vols, aquí sí pots retornar "/MeteoCandela"
    return "/MeteoCandela";
  }

  // Cloudflare Pages (pages.dev) normalment també és root
  return "";
}

export function getApi() {
  const BASE = getBase();
  const API_BASE = `${BASE}/api`;

  return {
    BASE,
    API_BASE,

    // Timeseries (5')
    HISTORY_URL: `${API_BASE}/history`,
    CURRENT_URL: `${API_BASE}/current`,
    HEARTBEAT_URL: `${API_BASE}/heartbeat`,

    // Forecast / municipis
    FORECAST_URL: `${API_BASE}/forecast`,
    MUNICIPIS_URL: `${API_BASE}/municipis`,

    // Resums diaris
    // - DAILY_URL: resum diari "legacy" (si el fas servir a altres pantalles)
    // - DAILY_SUMMARY_D1_URL: resum diari D1 (per agrícola-històric)
    DAILY_URL: `${API_BASE}/daily-summary`,
    DAILY_SUMMARY_D1_URL: `${API_BASE}/daily-summary-d1-array`,

    // Push
    PUSH_PUBLIC_KEY_URL: `${API_BASE}/push/public-key`,
    PUSH_SUBSCRIBE_URL: `${API_BASE}/push/subscribe`,
    PUSH_UNSUBSCRIBE_URL: `${API_BASE}/push/unsubscribe`,
    PUSH_COUNT_URL: `${API_BASE}/push/subscriptions-count`,
  };
}
