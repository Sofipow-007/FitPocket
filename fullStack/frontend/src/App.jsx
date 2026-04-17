import "./App.css";
import Navbar from "./components/NavBar/Navbar";
import IMCCalculator from "./components/IMCCalculator/IMCCalculator";

function App() {
  return (
    <div className="App">
      <Navbar />
      <main>
        <IMCCalculator />
      </main>
    </div>
  );
}

export default App;
