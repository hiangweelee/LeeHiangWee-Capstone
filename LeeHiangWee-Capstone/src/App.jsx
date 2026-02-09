import "./App.css";
import StockForm from "./components/StockForm";
import StockList from "./components/StockList";

export default function App() {
  return (
    <div className="dashboard">
      <header className="page-header">
        <h1 className="title">Finance Dashboard</h1>
      </header>

      <StockForm />
      <StockList />
    </div>
  );
}