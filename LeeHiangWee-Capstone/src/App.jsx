// src/App.jsx
import { useState } from "react";
import "./App.css";

/**
 * Item 1 — StockForm
 * A form with:
 *  - Stock symbol (text)
 *  - Quantity of shares (number)
 *  - Purchase price per share (number)
 *  - Submit button ("Add Stock")
 *
 * Requirement note: The form does not have to work yet.
 * We still include local state so the inputs are controlled,
 * but onSubmit is intentionally a no-op.
 */
function StockForm() {
  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    // Intentionally no business logic for now.
    // You can temporarily log for sanity if you like:
    // console.log({ symbol, qty, price });
  }

  return (
    <form className="stock-form" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor="symbol">Stock Symbol</label>
      <input
        id="symbol"
        className="input symbol"
        type="text"
        placeholder="AAPL"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        aria-label="Stock symbol"
      />

      <label className="visually-hidden" htmlFor="quantity">Quantity</label>
      <input
        id="quantity"
        className="input quantity"
        type="number"
        min="0"
        step="1"
        placeholder="2"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        aria-label="Quantity of shares"
      />

      <label className="visually-hidden" htmlFor="price">Purchase Price</label>
      <input
        id="price"
        className="input price"
        type="number"
        min="0"
        step="0.01"
        placeholder="123.99"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        aria-label="Purchase price per share"
      />

      <button className="btn add" type="submit">Add Stock</button>
    </form>
  );
}

/**
 * Item 3 — Dashboard visual shell
 * This section sets up the structure we’ll style next.
 * (Empty state is fine for now.)
 */
function StockList() {
  return (
    <section className="stock-list">
      <h2 className="section-title">Stock List</h2>
      <p className="empty">No stocks added yet.</p>
    </section>
  );
}

export default function App() {
  return (
    <div className="dashboard">
      <header className="page-header">
        <h1 className="title">Finance Dashboard</h1>
      </header>

      {/* Item 1: the form (no functionality required yet) */}
      <StockForm />

      {/* Item 3: placeholder list section for layout & styling */}
      <StockList />
    </div>
  );
}