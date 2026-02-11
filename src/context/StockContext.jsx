import { createContext, useContext, useMemo, useState } from "react";

const StockContext = createContext(null);

/**
 * Validate symbol format locally first (fast)
 * Supports: AAPL, MSFT, BRK.B, ^GSPC, EURUSD=X, etc.
 */
function isValidSymbolFormat(symbol) {
  return /^[A-Z0-9.^=\-]{1,15}$/.test(symbol);
}

/**
 * Default symbol existence check using Yahoo "search" endpoint.
 * NOTE: If this is blocked by CORS in your deployment, switch this function
 * to call the SAME API endpoint you already use to fetch stock data.
 */
async function validateSymbolExists(symbol) {
  // Yahoo search endpoint (commonly works when quote endpoints break)
  const url =
    `https://query2.finance.yahoo.com/v1/finance/search?` +
    `q=${encodeURIComponent(symbol)}&quotesCount=1&newsCount=0`;

  const res = await fetch(url);
  if (!res.ok) return { ok: false, reason: "Symbol not found." };

  const data = await res.json();
  const quotes = data?.quotes;

  // Ensure we got at least one match and that symbol matches exactly
  const first = Array.isArray(quotes) ? quotes[0] : null;

  if (!first?.symbol) {
    return { ok: false, reason: "No matching ticker found." };
  }

  // Some searches return partial matches; require exact symbol match
  if (String(first.symbol).toUpperCase() !== symbol) {
    return { ok: false, reason: "No exact match for this ticker." };
  }

  return { ok: true };
}

/**
 * Stock item shape:
 * { id, symbol, quantity, purchasePrice, createdAt }
 */
export function StockProvider({ children }) {
  const [stocks, setStocks] = useState([]);

  /**
   * addStock now returns a status:
   *  - { ok: true }  when added
   *  - { ok: false, reason } when not added
   */
  const addStock = async (payload) => {
    const symbol = String(payload.symbol || "").toUpperCase().trim();
    const quantity = Number(payload.quantity);
    const purchasePrice = Number(payload.purchasePrice);

    // Basic guard
    if (!symbol || quantity <= 0 || purchasePrice <= 0) {
      return { ok: false, reason: "Please enter valid symbol, quantity, and price." };
    }

    // Local format check
    if (!isValidSymbolFormat(symbol)) {
      return { ok: false, reason: "Invalid symbol format." };
    }

    // Prevent duplicates (optional but usually desired)
    const existsAlready = stocks.some((s) => s.symbol === symbol);
    if (existsAlready) {
      return { ok: false, reason: `${symbol} is already in your list.` };
    }

    // ✅ NEW: validate symbol existence BEFORE adding
    try {
      const validation = await validateSymbolExists(symbol);
      if (!validation.ok) return validation;
    } catch (e) {
      // If validation cannot be performed (CORS/network), do NOT add
      return { ok: false, reason: "Unable to validate symbol right now." };
    }

    // If valid, add to list
    setStocks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        symbol,
        quantity,
        purchasePrice,
        createdAt: Date.now(),
      },
    ]);

    return { ok: true };
  };

  const removeStock = (id) => {
    setStocks((prev) => prev.filter((s) => s.id !== id));
  };

  const clearStocks = () => setStocks([]);

  const value = useMemo(
    () => ({ stocks, addStock, removeStock, clearStocks }),
    [stocks]
  );

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}

export function useStocks() {
  const ctx = useContext(StockContext);
  if (!ctx) {
    throw new Error("useStocks must be used within <StockProvider />");
  }
  return ctx;
}
