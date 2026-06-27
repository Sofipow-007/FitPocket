const axios = require('axios')

// Llama al webhook de N8N y retorna el plan generado por IA
const dispararPlan = async (userId, perfil) => {
  const respuesta = await axios.post(process.env.N8N_WEBHOOK_URL, {
    userId,
    perfil
  })
  // N8N responde con { ok: true, plan: {...} }
  return respuesta.data
}

module.exports = { dispararPlan }