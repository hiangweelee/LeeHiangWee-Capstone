import { useState } from "react";
import { useStocks } from "../context/StockContext";

export default function StockForm() {
  const { addStock } = useStocks();
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    const qty = Number(quantity);
    const price = Number(purchasePrice);
    const sym = symbol.trim().toUpperCase();

    if (!sym || qty <= 0 || price <= 0) return;

    addStock({ symbol: sym, quantity: qty, purchasePrice: price });

    // reset fields
    setSymbol("");
    setQuantity("");
    setPurchasePrice("");
  }

  return (
    <form className="stock-form" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor="symbol">Stock Symbol</label>
      <input
        id="symbol"
        className="input symbol"
        type="text"
        placeholder="Stock Symbol"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        aria-label="Stock symbol"
        required
      />

      <label className="visually-hidden" htmlFor="quantity">Quantity</label>
      <input
        id="quantity"
        className="input quantity"
        type="number"
        min="1"
        step="1"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        aria-label="Quantity"
        required
      />

      <label className="visually-hidden" htmlFor="purchasePrice">
        Purchase Price
      </label>
      <input
        id="purchasePrice"
        className="input price"
        type="number"
        min="0"
        step="0.01"
        placeholder="Purchase Price"
        value={purchasePrice}
        onChange={(e) => setPurchasePrice(e.target.value)}
        aria-label="Purchase price per share"
        required
      />

      <button className="btn add" type="submit">Add Stock</button>
    </form>
  );
}