// src/services/alphaVantage.js
const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY;

export async function fetchQuote(symbol, { signal } = {}) {
  const sym = String(symbol || "").toUpperCase().trim();
  if (!sym) throw new Error("Empty symbol");

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "GLOBAL_QUOTE");
  url.searchParams.set("symbol", sym);
  url.searchParams.set("apikey", API_KEY || "");

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  if (data?.Note) throw new Error("AlphaVantage rate limit reached. Please try again shortly.");
  if (data?.["Error Message"]) throw new Error("AlphaVantage error: " + data["Error Message"]);

  const quote = data?.["Global Quote"];
  const priceStr = quote?.["05. price"];
  const prevStr  = quote?.["08. previous close"];
  const latest   = quote?.["07. latest trading day"] ?? null;

  if (!priceStr) throw new Error("No price returned for this symbol.");

  const price = Number(priceStr);
  const previousClose = prevStr != null ? Number(prevStr) : null;
  if (Number.isNaN(price)) throw new Error("Invalid price format.");

  return { price, previousClose, lastRefreshed: latest };
}

export default fetchQuote;