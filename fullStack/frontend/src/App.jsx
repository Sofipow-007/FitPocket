import "./App.css";
import Navbar from "./components/NavBar/Navbar";
import Login from "./pages/Login/Login";

function App() {
  return (
    <div className="App">
      <Navbar />
      <main>
        <Login />
      </main>
    </div>
  );
}

export default App;
