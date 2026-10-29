const GroqStrategy = require('./GroqStrategy')
const OllamaStrategy = require('./OllamaStrategy')

// Patrón Factory Method: crea la estrategia de IA según IA_PROVIDER.
// Para sumar un proveedor alcanza con una clase nueva y una entrada acá.
const PROVEEDORES = {
  groq: () => new GroqStrategy(),
  ollama: () => new OllamaStrategy(),
}

function proveedorConfigurado() {
  return (process.env.IA_PROVIDER || 'groq').trim().toLowerCase()
}

function crearEstrategiaIA(proveedor = proveedorConfigurado()) {
  const crear = PROVEEDORES[proveedor]
  if (!crear) {
    throw new Error(
      `IA_PROVIDER="${proveedor}" no es válido. Usá uno de: ${Object.keys(PROVEEDORES).join(', ')}.`
    )
  }
  return crear()
}

// Una sola estrategia por proceso (así Groq reusa su cliente HTTP)
let estrategia = null
function obtenerEstrategiaIA() {
  if (!estrategia) estrategia = crearEstrategiaIA()
  return estrategia
}

// Solo para tests: permite inyectar una estrategia falsa
function usarEstrategiaIA(nueva) {
  estrategia = nueva
}

module.exports = { crearEstrategiaIA, obtenerEstrategiaIA, usarEstrategiaIA, proveedorConfigurado, PROVEEDORES }
