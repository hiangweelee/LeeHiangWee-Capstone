// src/services/alphaVantage.js
const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY;

// 60s cache to avoid double-calling AV (validation + display)
const CACHE_TTL_MS = 60_000;
const quoteCache = new Map(); // sym -> { ts, value }

function getCached(sym) {
  const hit = quoteCache.get(sym);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    quoteCache.delete(sym);
    return null;
  }
  return hit.value;
}

function setCached(sym, value) {
  quoteCache.set(sym, { ts: Date.now(), value });
}

export async function fetchQuote(symbol, { signal } = {}) {
  const sym = String(symbol || "").toUpperCase().trim();
  if (!sym) throw new Error("Empty symbol");

  // ✅ If key missing, this will fail for ALL symbols (valid or invalid)
  if (!API_KEY) {
    throw new Error("Missing Alpha Vantage API key (VITE_ALPHA_VANTAGE_KEY).");
  }

  // ✅ Use cache (prevents “valid ticker shows error” due to rate limiting)
  const cached = getCached(sym);
  if (cached) return cached;

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "GLOBAL_QUOTE");
  url.searchParams.set("symbol", sym);
  url.searchParams.set("apikey", API_KEY);

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();

  // Rate limit or temporary service message
  if (data?.Note) {
    throw new Error("Rate limit reached. Please wait a bit and try again.");
  }

  // Explicit API error (invalid call, bad symbol format, etc.)
  if (data?.["Error Message"]) {
    throw new Error("Alpha Vantage error: " + data["Error Message"]);
  }

  // Some AV responses include "Information" for various issues
  if (data?.Information) {
    throw new Error(String(data.Information));
  }

  const quote = data?.["Global Quote"];
  const priceStr = quote?.["05. price"];
  const prevStr  = quote?.["08. previous close"];
  const latest   = quote?.["07. latest trading day"] ?? null;

  // ✅ This is the “invalid symbol” case for GLOBAL_QUOTE most of the time
  if (!priceStr) throw new Error("No price returned for this symbol.");

  const price = Number(priceStr);
  const previousClose = prevStr != null ? Number(prevStr) : null;

  if (Number.isNaN(price)) throw new Error("Invalid price format.");

  const value = { price, previousClose, lastRefreshed: latest };
  setCached(sym, value);
  return value;
}

export default fetchQuote;