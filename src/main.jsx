import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { StockProvider } from "./context/StockContext.jsx";
import "./index.css"; // (optional) if your scaffold includes it

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <StockProvider>
      <App />
    </StockProvider>
  </React.StrictMode>
);