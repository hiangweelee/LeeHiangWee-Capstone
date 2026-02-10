import { createContext, useContext, useMemo, useState } from "react";

const StockContext = createContext(null);

/**
 * Stock item shape:
 * { id, symbol, quantity, purchasePrice, createdAt }
 */
export function StockProvider({ children }) {
  const [stocks, setStocks] = useState([]);

  const addStock = (payload) => {
    const symbol = String(payload.symbol || "").toUpperCase().trim();
    const quantity = Number(payload.quantity);
    const purchasePrice = Number(payload.purchasePrice);

    // Basic guard; keep silent if inputs are invalid
    if (!symbol || quantity <= 0 || purchasePrice <= 0) return;

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
