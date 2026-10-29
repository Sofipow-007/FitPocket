const Groq = require('groq-sdk')
const EstrategiaIA = require('./EstrategiaIA')

// El plan gratuito de Groq permite 8000 tokens por minuto y un plan gasta ~4000:
// con dos o tres usuarios a la vez Groq responde 429. En vez de mostrarle el error
// al usuario, se espera lo que Groq indica y se vuelve a pedir.
const ESPERA_TOTAL_MAX_MS = 90000
const ESPERA_POR_INTENTO_MAX_MS = 30000
const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const segundosDeEspera = (error) => {
  const headers = error?.headers
  const valor = typeof headers?.get === 'function' ? headers.get('retry-after') : headers?.['retry-after']
  const segundos = Number(valor)
  return Number.isFinite(segundos) && segundos > 0 ? segundos : 15
}

// "Request too large" también llega como 429, pero esperar no lo arregla.
const esLimitePorMinuto = (error) => error?.status === 429 && !/too large/i.test(error?.message || '')

// Estrategia concreta: Groq (openai/gpt-oss-120b)
class GroqStrategy extends EstrategiaIA {
  constructor({ apiKey = process.env.GROQ_API_KEY, modelo = process.env.GROQ_MODEL || 'openai/gpt-oss-120b' } = {}) {
    super()
    this.apiKey = apiKey
    this.modelo = modelo
    this.client = null
  }

  get nombre() {
    return 'groq'
  }

  // El cliente se crea al primer uso: sin GROQ_API_KEY el backend arranca igual
  // y solo falla la generación del plan (antes tiraba abajo todo el servidor).
  getClient() {
    if (!this.client) {
      if (!this.apiKey) throw new Error('Falta GROQ_API_KEY en el .env')
      this.client = new Groq({ apiKey: this.apiKey })
    }
    return this.client
  }

  async completar(mensajes, temperatura) {
    let esperado = 0
    for (;;) {
      try {
        const res = await this.getClient().chat.completions.create({
          model: this.modelo,
          messages: mensajes,
          temperature: temperatura,
          max_tokens: 3500,
          reasoning_effort: 'low'
        })
        return res.choices[0].message.content
      } catch (error) {
        const ms = Math.min(segundosDeEspera(error) * 1000 + 500, ESPERA_POR_INTENTO_MAX_MS)
        if (!esLimitePorMinuto(error) || esperado + ms > ESPERA_TOTAL_MAX_MS) throw error
        console.log(`Groq al límite de tokens por minuto, reintentando en ${Math.round(ms / 1000)} s...`)
        esperado += ms
        await esperar(ms)
      }
    }
  }
}

module.exports = GroqStrategy
