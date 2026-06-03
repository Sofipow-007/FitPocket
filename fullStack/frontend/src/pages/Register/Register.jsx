import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import RegisterFormNew from "../../components/componentsRegister/RegisterFormNew";
import AuthModal from "../../components/componentsHomeGuest/AuthModal";

export default function Register() {
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-20 relative overflow-hidden"
      style={{ background: "#050508" }}
    >
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <div className="relative z-10 w-full">
        <RegisterFormNew
          onLoginClick={() => setIsAuthOpen(true)}
          onLogoClick={() => navigate("/")}
          onGoOnboarding={() => navigate("/onboarding")}
        />
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
