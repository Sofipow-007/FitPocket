import "./App.css";
import Navbar from "./components/NavBar/Navbar";
import IMCCalculator from "./components/IMCCalculator/IMCCalculator";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner"; 
import MiniBarChart from "./components/MiniBarChart/MiniBarChart";
import MiniLineChart from "./components/MiniLineChart/MiniLineChart";

function App() {

  const sampleData = [200, 50, 75, 40, 90]; // valores de ejemplo
  const sampleLineData = [100, 20, 70, 10, 100]; // valores de ejemplo

  return (
    <div className="App">
      <Navbar />
      <main>
        <IMCCalculator />
        <LoadingSpinner />
        <MiniBarChart data={sampleData} />
        <MiniLineChart data={sampleLineData} />
      </main>
    </div>
  );
}

export default App;
