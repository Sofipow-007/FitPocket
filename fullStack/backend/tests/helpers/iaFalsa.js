// Estrategia de IA falsa para los tests: responde un plan fijo sin llamar a Groq.
// Registra los prompts recibidos para poder revisarlos.
const EstrategiaIA = require('../../services/ia/EstrategiaIA')

const RUTINA = (dias) => dias.map(dia => ({
  dia,
  tipo: 'Fuerza',
  duracionMinutos: 45,
  ejercicios: [
    { nombre: 'Sentadilla con salto', series: 3, repeticiones: '10', descansoSegundos: 60, alternativas: [{ nombre: 'Sentadilla a la caja', series: 3, repeticiones: '10' }] },
    { nombre: 'Remo con mancuerna', series: 3, repeticiones: '12', descansoSegundos: 60, alternativas: [] },
  ],
}))

const DIETA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map(dia => ({
  dia,
  comida: { desayuno: { descripcion: 'Avena con fruta', calorias: 400 } },
  costoEstimadoDia: 2000,
}))

class IAFalsa extends EstrategiaIA {
  constructor({ dias = ['lunes', 'miercoles', 'viernes'] } = {}) {
    super()
    this.dias = dias
    this.prompts = []
  }

  get nombre() {
    return 'falsa'
  }

  async completar(mensajes) {
    const prompt = mensajes[0].content
    this.prompts.push(prompt)
    if (prompt.startsWith('Sos nutricionista')) return JSON.stringify({ dieta: DIETA })
    return JSON.stringify({
      meta: { objetivo: 'perder grasa', duracionSemanas: 8, caloriasObjetivoDia: 2100, nivelDificultad: 'Intermediate', justificacion: 'test' },
      rutina: RUTINA(this.dias),
    })
  }
}

module.exports = IAFalsa
