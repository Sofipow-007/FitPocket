import "./Register.css";
import RegisterHero from "../../components/componentsRegister/RegisterHero";
import RegisterForm from "../../components/componentsRegister/RegisterForm";
import RegisterInfo from "../../components/componentsRegister/RegisterInfo";

export default function Register() {
  return (
    <div className="register-container">
      <RegisterHero />
      <div className="register-page">
        <div className="register-left">
          <RegisterInfo />
        </div>
        <div className="register-right">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
