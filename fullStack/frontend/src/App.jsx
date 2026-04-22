import "./App.css";
import Navbar from "./components/NavBar/Navbar";
import IMCCalculator from "./components/IMCCalculator/IMCCalculator";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner"; 
import MiniBarChart from "./components/MiniBarChart/MiniBarChart";


function App() {

  const sampleData = [20, 50, 75, 40, 90]; // valores de ejemplo

  return (
    <div className="App">
      <Navbar />
      <main>
        <IMCCalculator />
        <LoadingSpinner />
        <MiniBarChart data={sampleData} />
      </main>
    </div>
  );
}

export default App;
