// src/services/alphaVantage.js
const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY;

// Helpful console diagnostics
if (!API_KEY) {
  // This warns you immediately if Vite didn't load your .env
  // (You must restart `npm run dev` after editing .env)
  console.warn(
    "[alphaVantage] Missing VITE_ALPHA_VANTAGE_KEY. Set it in your project root .env and restart Vite."
  );
}

/**
 * Fetch latest price for a symbol using AlphaVantage GLOBAL_QUOTE.
 * Returns: { price: number, lastRefreshed: string|null }
 * Throws an Error with a human-readable message on failure.
 */
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

  // Uncomment if you want to see the raw response for debugging:
  // console.debug("[alphaVantage] raw", sym, data);

  if (data?.Note) {
    // free tier: ~5 req/min and ~1 req/sec
    throw new Error("AlphaVantage rate limit reached. Please try again shortly.");
  }
  if (data?.["Error Message"]) {
    throw new Error("AlphaVantage error: " + data["Error Message"]);
  }

  const quote = data?.["Global Quote"];
  const priceStr = quote?.["05. price"];
  const latest = quote?.["07. latest trading day"] ?? null;

  if (!priceStr) {
    throw new Error("No price returned for this symbol.");
  }

  const price = Number(priceStr);
  if (Number.isNaN(price)) {
    throw new Error("Invalid price format.");
  }

  return { price, lastRefreshed: latest };
}

// Optional default export so either import style works
export default fetchQuote;