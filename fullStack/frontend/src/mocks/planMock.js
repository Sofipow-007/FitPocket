/* Datos de ejemplo con la forma completa que genera services/iaService.js (backend). */

export const MOCK_PERFIL = {
  nombre: "Juan Pérez",
  email:  "juan.perez@example.com",
  perfil: {
    peso: 75, altura: 178, edad: 22, sexo: "masculino",
    objetivo: "ganar músculo", nivel: "intermedio",
    minutosPorSesion: 60,
  },
};

const DESCANSO = { series: 0, repeticiones: "", ejercicios: [] };

const RUTINA_MOCK = {
  Lunes: {
    tipo: "Tren superior — empuje",
    duracionMinutos: 60,
    ejercicios: [
      { nombre: "Press de banca",       series: 4, repeticiones: "8",      descansoSegundos: 90,  nota: "Controlá el descenso.",
        alternativas: [
          { nombre: "Press inclinado con mancuernas", series: 4, repeticiones: "10", descansoSegundos: 90, nota: "Enfatiza pecho superior." },
          { nombre: "Fondos en paralelas",             series: 3, repeticiones: "10", descansoSegundos: 75, nota: "Torso inclinado adelante." },
        ] },
      { nombre: "Press militar",        series: 3, repeticiones: "10",     descansoSegundos: 75,  nota: "Core firme durante todo el movimiento." },
      { nombre: "Fondos en banco",      series: 3, repeticiones: "12",     descansoSegundos: 60,  nota: "" },
    ],
  },
  Martes: {
    tipo: "Tren inferior",
    duracionMinutos: 60,
    ejercicios: [
      { nombre: "Sentadilla",           series: 4, repeticiones: "8",      descansoSegundos: 120, nota: "Rodillas alineadas con los pies.",
        alternativas: [
          { nombre: "Prensa de piernas", series: 4, repeticiones: "10", descansoSegundos: 100, nota: "Buena opción si molesta la zona lumbar." },
        ] },
      { nombre: "Zancadas",             series: 3, repeticiones: "10 c/pierna", descansoSegundos: 75, nota: "" },
      { nombre: "Curl femoral",         series: 3, repeticiones: "12",     descansoSegundos: 60,  nota: "" },
    ],
  },
  Miércoles: DESCANSO,
  Jueves: {
    tipo: "Tren superior — tracción",
    duracionMinutos: 60,
    ejercicios: [
      { nombre: "Remo con barra",       series: 4, repeticiones: "8",      descansoSegundos: 90,  nota: "Codos cerca del cuerpo.",
        alternativas: [
          { nombre: "Jalón al pecho",   series: 4, repeticiones: "10", descansoSegundos: 90, nota: "Alternativa si no hay barra libre." },
        ] },
      { nombre: "Dominadas asistidas",  series: 3, repeticiones: "8",      descansoSegundos: 90,  nota: "" },
      { nombre: "Curl de bíceps",       series: 3, repeticiones: "12",     descansoSegundos: 60,  nota: "" },
    ],
  },
  Viernes: DESCANSO,
  Sábado: {
    tipo: "Full body + core",
    duracionMinutos: 45,
    ejercicios: [
      { nombre: "Sentadilla goblet",    series: 3, repeticiones: "12",     descansoSegundos: 75,  nota: "" },
      { nombre: "Press de banca",       series: 3, repeticiones: "10",     descansoSegundos: 75,  nota: "" },
      { nombre: "Plancha",              series: 3, repeticiones: "45s",    descansoSegundos: 45,  nota: "Cuerpo en línea recta." },
    ],
  },
  Domingo: {
    tipo: "Cardio + core",
    duracionMinutos: 40,
    ejercicios: [
      { nombre: "Cardio HIIT",          series: 6, repeticiones: "30s on / 30s off", descansoSegundos: 30, nota: "" },
      { nombre: "Crunch abdominal",     series: 3, repeticiones: "15",     descansoSegundos: 45,  nota: "" },
    ],
  },
};

const DIETA_MOCK = {
  desayuno: { descripcion: "Avena con leche y banana",                       calorias: 350 },
  almuerzo: { descripcion: "Pechuga de pollo con arroz integral y ensalada", calorias: 550 },
  merienda: { descripcion: "Yogur descremado con nueces",                    calorias: 200 },
  cena:     { descripcion: "Huevos revueltos con verduras salteadas",        calorias: 400 },
  costoEstimadoDia: 4200,
};

const DIAS_ORDEN = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const MOCK_PLAN = {
  meta: {
    objetivo: "ganar músculo",
    duracionSemanas: 8,
    caloriasObjetivoDia: 1500,
    nivelDificultad: "intermedio",
    justificacion: "Plan de ejemplo — datos de muestra, no generado por IA.",
  },
  rutina: DIAS_ORDEN.map(dia => ({ dia, ...RUTINA_MOCK[dia] })),
  dieta:  DIAS_ORDEN.map(dia => ({ dia, ...DIETA_MOCK })),
};
