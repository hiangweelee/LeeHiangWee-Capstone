import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStocks } from "../context/StockContext";
// If your file is in src/services, keep this import. If it's in src/lib, change path accordingly.
import { fetchQuote } from "../services/alphaVantage";

function formatCurrency(v) {
  if (v == null || Number.isNaN(v)) return "-";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(v);
}

export default function StockList() {
  const { stocks, removeStock } = useStocks();

  // quotes: { [symbol]: { price, lastRefreshed, loading, error } }
  const [quotes, setQuotes] = useState({});
  const abortRef = useRef(null);

  const uniqueSymbols = useMemo(
    () => Array.from(new Set(stocks.map((s) => s.symbol))),
    [stocks]
  );

  const setLoading = (sym, flag) =>
    setQuotes((prev) => ({
      ...prev,
      [sym]: { ...(prev[sym] || {}), loading: flag, error: null },
    }));

  const setError = (sym, errMsg) =>
    setQuotes((prev) => ({
      ...prev,
      [sym]: { ...(prev[sym] || {}), loading: false, error: errMsg },
    }));

  const setPrice = (sym, payload) =>
    setQuotes((prev) => ({
      ...prev,
      [sym]: { ...payload, loading: false, error: null },
    }));

  // Memoized fetcher (useCallback)
  const fetchAllQuotes = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    // sequential fetch to be kind to AlphaVantage free-tier limits
    for (const sym of uniqueSymbols) {
      try {
        setLoading(sym, true);
        // small delay between calls (e.g., 1s)
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 1000));

        // eslint-disable-next-line no-await-in-loop
        const { price, lastRefreshed } = await fetchQuote(sym, {
          signal: abortRef.current.signal,
        });
        setPrice(sym, { price, lastRefreshed });
      } catch (err) {
        if (err?.name !== "AbortError") {
          setError(sym, err?.message || "Failed to fetch quote");
        }
      }
    }
  }, [uniqueSymbols]);

  // Fetch on mount & whenever the stock list changes (useEffect)
  useEffect(() => {
    if (uniqueSymbols.length === 0) return;
    fetchAllQuotes();

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchAllQuotes, uniqueSymbols]);

  // Derived render payload: group each purchase with its symbol quote
  const rows = useMemo(() => {
    return stocks.map((s) => {
      const q = quotes[s.symbol];
      const current = q?.price ?? null;
      const invested = s.purchasePrice * s.quantity;
      const marketValue = current != null ? current * s.quantity : null;
      const pnl = marketValue != null ? marketValue - invested : null;
      const status =
        pnl == null ? "unknown" : pnl > 0 ? "profit" : pnl < 0 ? "loss" : "even";

      return { ...s, current, pnl, marketValue, status, quote: q };
    });
  }, [stocks, quotes]);

  if (stocks.length === 0) {
    // Conditional Rendering: empty list
    return (
      <section className="stock-list">
        <h2 className="section-title">Stock List</h2>
        <p className="empty">No stocks added yet.</p>
      </section>
    );
  }

  return (
    <section className="stock-list">
      <h2 className="section-title">Stock List</h2>

      <ul className="rows">
        {rows.map((row) => (
          <li className="row" key={row.id}>
            <div className="row-main">
              <div className="symbol">{row.symbol}</div>
              <div className="meta">
                <span>Qty: {row.quantity}</span>
                <span>Buy @ {formatCurrency(row.purchasePrice)}</span>
              </div>
            </div>

            {/* Conditional Rendering: Only show current price and P/L when available */}
            <div className="row-stats">
              {row.quote?.loading && <span className="muted">Fetching…</span>}

              {!row.quote?.loading && row.quote?.error && (
                <span className="error">{row.quote.error}</span>
              )}

              {!row.quote?.loading && !row.quote?.error && row.current != null && (
                <>
                  <span className="now">
                    Now: <strong>{formatCurrency(row.current)}</strong>
                  </span>
                  <span
                    className={
                      row.status === "profit"
                        ? "pnl profit"
                        : row.status === "loss"
                        ? "pnl loss"
                        : "pnl even"
                    }
                  >
                    {row.status === "profit" ? "Profit" : row.status === "loss" ? "Loss" : "P/L"}:{" "}
                    <strong>{formatCurrency(row.pnl)}</strong>
                  </span>
                </>
              )}
            </div>

            <div className="row-actions">
              <button className="btn link danger" onClick={() => removeStock(row.id)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="list-footer">
        <button className="btn ghost" onClick={fetchAllQuotes}>
          Refresh Prices
        </button>
      </div>
    </section>
  );
}