// Patrón Strategy: interfaz común de los proveedores de IA. iaService le pide
// texto a "la estrategia" sin saber si atrás está Groq, Ollama u otro.
class EstrategiaIA {
    get nombre() {
        throw new Error('Cada estrategia tiene que definir su nombre');
    }

    // mensajes: [{ role, content }] — devuelve el texto de la respuesta
    async completar(mensajes, temperatura) { // eslint-disable-line no-unused-vars
        throw new Error(`${this.nombre}: completar() no implementado`);
    }
}

module.exports = EstrategiaIA;
