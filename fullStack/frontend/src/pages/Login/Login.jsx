import "./Login.css";
import LoginForm from "../../components/componentsLogin/LoginForm";
import LoginInfo from "../../components/componentsLogin/LoginInfo";
import LoginHero from "../../components/componentsLogin/LoginHero";

export default function Login() {
  return (
    <div className="login-container">
      <LoginHero />
      <div className="login-page">
        <div className="login-left">
          <LoginForm />
        </div>
        <div className="login-right">
          <LoginInfo />
        </div>
      </div>
    </div>
  );
}
