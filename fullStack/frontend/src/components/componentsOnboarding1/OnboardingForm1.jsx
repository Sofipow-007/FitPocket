import Dropdown from "../DropDown/Dropdown";
import "./OnboardingForm1.css";

export default function OnboardingForm1() {
  return (
    <form className="onboarding-form1">
      <label>Edad</label>
      <input type="number" placeholder="Edad" />

      <label>Peso (kg)</label>
      <input type="number" placeholder="Peso" />

      <label>Altura (cm)</label>
      <input type="number" placeholder="Altura" />

      <Dropdown
        label="Sexo"
        options={[
          { value: "femenino", label: "Femenino" },
          { value: "masculino", label: "Masculino" },
        ]}
        value=""
        onChange={() => {}}
      />


      <button type="submit" className="next-button">Siguiente →</button>
    </form>
  );
}
