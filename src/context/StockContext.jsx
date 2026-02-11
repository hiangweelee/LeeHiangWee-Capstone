import { createContext, useContext, useMemo, useState } from "react";
import { fetchQuote } from "../services/alphaVantage"; // uses your existing Alpha Vantage service

const StockContext = createContext(null);

/**
 * Stock item shape:
 * { id, symbol, quantity, purchasePrice, createdAt }
 */
export function StockProvider({ children }) {
  const [stocks, setStocks] = useState([]);

  // ✅ async so we can validate symbol via Alpha Vantage before adding
  const addStock = async (payload) => {
    const symbol = String(payload.symbol || "").toUpperCase().trim();
    const quantity = Number(payload.quantity);
    const purchasePrice = Number(payload.purchasePrice);

    // basic guard
    if (!symbol || quantity <= 0 || purchasePrice <= 0) {
      return { ok: false, reason: "Please enter valid symbol, quantity, and price." };
    }

    // prevent duplicates (optional but nice UX)
    if (stocks.some((s) => s.symbol === symbol)) {
      return { ok: false, reason: `${symbol} is already in your list.` };
    }

    // ✅ Validate using the SAME endpoint you already rely on
    try {
      await fetchQuote(symbol);
    } catch (err) {
      return { ok: false, reason: err?.message || "Invalid ticker symbol." };
    }

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

// ✅ This MUST be a named export since StockForm imports { useStocks }
export function useStocks() {
  const ctx = useContext(StockContext);
  if (!ctx) {
    throw new Error("useStocks must be used within <StockProvider />");
  }
  return ctx;
}