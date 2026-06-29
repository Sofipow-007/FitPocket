const axios = require('axios')

const dispararPlan = async (userId, perfil) => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL || process.env.WEBHOOK_URL

  if (!webhookUrl) {
    throw new Error('No está configurada la URL del webhook de n8n')
  }

  try {
    const respuesta = await axios.post(webhookUrl, {
      userId,
      perfil
    }, {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return respuesta.data
  } catch (error) {
    const detail = error.response?.data || error.message
    console.error('Error al llamar al webhook de n8n:', detail)
    throw new Error(`Fallo al invocar el webhook: ${JSON.stringify(detail)}`)
  }
}

module.exports = { dispararPlan }