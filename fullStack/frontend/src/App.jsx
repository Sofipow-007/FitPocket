import "./App.css";
import Navbar from "./components/NavBar/Navbar";
import IMCCalculator from "./components/IMCCalculator/IMCCalculator";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner"; 


function App() {
  return (
    <div className="App">
      <Navbar />
      <main>
        <IMCCalculator />
        <LoadingSpinner />
      </main>
    </div>
  );
}

export default App;
