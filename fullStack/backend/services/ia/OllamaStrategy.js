const EstrategiaIA = require('./EstrategiaIA')

// Estrategia concreta: Ollama corriendo local (o en otra máquina), sin límite de
// tokens por minuto ni costo. Se habla por HTTP con la API /api/chat.
class OllamaStrategy extends EstrategiaIA {
  constructor({
    url = process.env.OLLAMA_URL || 'http://localhost:11434',
    modelo = process.env.OLLAMA_MODEL || 'llama3.1',
    timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS) || 180000,
  } = {}) {
    super()
    this.url = url.replace(/\/+$/, '')
    this.modelo = modelo
    this.timeoutMs = timeoutMs
  }

  get nombre() {
    return 'ollama'
  }

  async completar(mensajes, temperatura) {
    let res
    try {
      res = await fetch(`${this.url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelo,
          messages: mensajes,
          stream: false,
          options: { temperature: temperatura },
        }),
        // un modelo local grande puede tardar, pero no infinito
        signal: AbortSignal.timeout(this.timeoutMs),
      })
    } catch (error) {
      throw new Error(`No se pudo conectar con Ollama en ${this.url}: ${error.message}`)
    }

    if (!res.ok) {
      const detalle = await res.text().catch(() => '')
      throw new Error(`Ollama respondió ${res.status}: ${detalle.slice(0, 200)}`)
    }
    const data = await res.json()
    return data?.message?.content ?? ''
  }
}

module.exports = OllamaStrategy
