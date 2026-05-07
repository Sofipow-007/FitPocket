import "./App.css";
import Navbar from "./components/NavBar/Navbar";
import Guest from "./pages/Guest/Guest";
import Login from "./pages/Login/Login";

function App() {
  return (
    <div className="App">
      <main className="main-content">
        <Guest />
      </main>
    </div>
  );
}


export default App;
