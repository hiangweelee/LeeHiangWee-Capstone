import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStocks } from "../context/StockContext";
import { fetchQuote } from "../services/alphaVantage";

function formatCurrency(v) {
  if (v == null || Number.isNaN(v)) return "-";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(v);
}

/** Tiny inline sparkline from previousClose -> current price */
function Sparkline({ prev, current, width = 78, height = 26 }) {
  if (prev == null || current == null) return null;

  const min = Math.min(prev, current);
  const max = Math.max(prev, current);
  // prevent divide-by-zero
  const range = max - min || 1;

  // map price -> y (SVG y grows downward, so invert)
  const yPrev = height - ((prev - min) / range) * height;
  const yCurr = height - ((current - min) / range) * height;

  const trend = current > prev ? "up" : current < prev ? "down" : "flat";
  const path = `M 2 ${yPrev.toFixed(2)} L ${width - 2} ${yCurr.toFixed(2)}`;

  return (
    <svg
      className={`sparkline ${trend}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
    >
      <path className="sparkline-path" d={path} />
      <circle className="spark-dot" cx="2" cy={yPrev} r="2" />
      <circle className="spark-dot" cx={width - 2} cy={yCurr} r="2" />
    </svg>
  );
}

export default function StockList() {
  const { stocks, removeStock } = useStocks();

  // quotes: { [symbol]: { price, previousClose, lastRefreshed, loading, error } }
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

  // Fetcher with a small delay to respect free-tier limits
  const fetchAllQuotes = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    for (const sym of uniqueSymbols) {
      try {
        setLoading(sym, true);
        await new Promise((r) => setTimeout(r, 1000)); // ~1s pacing
        const { price, previousClose, lastRefreshed } = await fetchQuote(sym, {
          signal: abortRef.current.signal,
        });
        setPrice(sym, { price, previousClose, lastRefreshed });
      } catch (err) {
        if (err?.name !== "AbortError") setError(sym, err?.message || "Failed to fetch quote");
      }
    }
  }, [uniqueSymbols]);

  useEffect(() => {
    if (uniqueSymbols.length === 0) return;
    fetchAllQuotes();
    return () => abortRef.current?.abort();
  }, [fetchAllQuotes, uniqueSymbols]);

  // Build rows for rendering
  const rows = useMemo(() => {
    return stocks.map((s) => {
      const q = quotes[s.symbol];
      const current = q?.price ?? null;
      const prev = q?.previousClose ?? null;
      const invested = s.purchasePrice * s.quantity;
      const marketValue = current != null ? current * s.quantity : null;
      const pnl = marketValue != null ? marketValue - invested : null;
      const status = pnl == null ? "unknown" : pnl > 0 ? "profit" : pnl < 0 ? "loss" : "even";
      const dayTrend = current != null && prev != null ? (current - prev) : null;

      return { ...s, current, prev, pnl, marketValue, status, dayTrend, quote: q };
    });
  }, [stocks, quotes]);

  // Summary Card totals
  const totals = useMemo(() => {
    const invested = stocks.reduce((sum, s) => sum + s.purchasePrice * s.quantity, 0);
    const marketValue = rows.reduce((sum, r) => sum + (r.marketValue ?? 0), 0);
    const pricedCount = rows.filter((r) => r.current != null).length;
    const pnl = marketValue - invested;
    const pnlPct = invested > 0 ? pnl / invested : null;
    return { invested, marketValue, pnl, pnlPct, pricedCount, positions: stocks.length };
  }, [stocks, rows]);

  if (stocks.length === 0) {
    return (
      <section className="stock-list">
        <h2 className="section-title">Stock List</h2>
        <p className="empty">No stocks added yet.</p>
      </section>
    );
  }

  return (
    <section className="stock-list">
      {/* Summary Card */}
      <div className="summary-card" role="region" aria-label="Portfolio Summary">
        <div className="kpi-grid">
          <div className="kpi">
            <div className="kpi-label">Total Invested</div>
            <div className="kpi-value">{formatCurrency(totals.invested)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Market Value</div>
            <div className="kpi-value">{formatCurrency(totals.marketValue)}</div>
          </div>
          <div
            className={`kpi ${totals.pnl > 0 ? "kpi-profit" : totals.pnl < 0 ? "kpi-loss" : ""}`}
          >
            <div className="kpi-label">P/L</div>
            <div className="kpi-value">
              {formatCurrency(totals.pnl)}
              {totals.pnlPct != null && (
                <span className="kpi-sub"> ({(totals.pnlPct * 100).toFixed(2)}%)</span>
              )}
            </div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Positions</div>
            <div className="kpi-value">
              {totals.positions}
              <span className="kpi-sub"> • priced: {totals.pricedCount}</span>
            </div>
          </div>
        </div>
      </div>

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

            {/* Minimal sparkline (previous close -> current) */}
            <div className="row-spark">
              <Sparkline prev={row.prev} current={row.current} />
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