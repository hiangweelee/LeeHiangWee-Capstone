import { fetchQuote } from "../services/alphaVantage";

// ...

const addStock = async (payload) => {
  const symbol = String(payload.symbol || "").toUpperCase().trim();
  const quantity = Number(payload.quantity);
  const purchasePrice = Number(payload.purchasePrice);

  if (!symbol || quantity <= 0 || purchasePrice <= 0) {
    return { ok: false, reason: "Please enter valid symbol, quantity, and price." };
  }

  // Duplicate prevention
  if (stocks.some((s) => s.symbol === symbol)) {
    return { ok: false, reason: `${symbol} is already in your list.` };
  }

  // ✅ Validate using the same call the rest of your app relies on
  try {
    await fetchQuote(symbol);
  } catch (err) {
    // Rate limit is not “invalid” — but we still won't add (requirement)
    return { ok: false, reason: err?.message || "Unable to validate symbol." };
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