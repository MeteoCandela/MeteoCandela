// lib/env.js
export function getBase() {
  const host = location.hostname.toLowerCase();

  if (host.endsWith("github.io")) {
    return "/MeteoCandela";
  }
  return "";
}

export function getApi() {
  const BASE = getBase();
  const API_BASE = `${BASE}/api`;

  return {
    BASE,
    API_BASE,

    HISTORY_URL: `${API_BASE}/history`,
    CURRENT_URL: `${API_BASE}/current`,
    HEARTBEAT_URL: `${API_BASE}/heartbeat`,
    FORECAST_URL: `${API_BASE}/forecast`,
    MUNICIPIS_URL: `${API_BASE}/municipis`,

    // (si la mantens per compatibilitat)
    DAILY_URL: `${API_BASE}/daily-summary`,

    // ✅ NOU: resum diari a D1 (array)
    DAILY_SUMMARY_D1_URL: `${API_BASE}/daily-summary-d1-array`,

    PUSH_PUBLIC_KEY_URL: `${API_BASE}/push/public-key`,
    PUSH_SUBSCRIBE_URL:  `${API_BASE}/push/subscribe`,
    PUSH_UNSUBSCRIBE_URL:`${API_BASE}/push/unsubscribe`,
    PUSH_COUNT_URL:      `${API_BASE}/push/subscriptions-count`,
  };
}
