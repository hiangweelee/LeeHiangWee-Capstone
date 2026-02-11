import { useState } from "react";
import { useStocks } from "../context/StockContext";

export default function StockForm() {
  const { addStock } = useStocks();
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const qty = Number(quantity);
    const price = Number(purchasePrice);
    const sym = symbol.trim().toUpperCase();

    if (!sym || qty <= 0 || price <= 0) return;

    setIsSubmitting(true);
    const result = await addStock({ symbol: sym, quantity: qty, purchasePrice: price });
    setIsSubmitting(false);

    if (!result?.ok) {
      setError(`"${sym}" was not added. ${result?.reason || ""}`.trim());
      return;
    }

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
        onChange={(e) => {
          setSymbol(e.target.value);
          if (error) setError("");
        }}
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
        onChange={(e) => {
          setQuantity(e.target.value);
          if (error) setError("");
        }}
        aria-label="Quantity"
        required
      />

      <label className="visually-hidden" htmlFor="purchasePrice">Purchase Price</label>
      <input
        id="purchasePrice"
        className="input price"
        type="number"
        min="0"
        step="0.01"
        placeholder="Purchase Price"
        value={purchasePrice}
        onChange={(e) => {
          setPurchasePrice(e.target.value);
          if (error) setError("");
        }}
        aria-label="Purchase price per share"
        required
      />

      <button className="btn add" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Validating..." : "Add Stock"}
      </button>

      {error && <div className="form-error" role="alert">{error}</div>}
    </form>
  );
}
