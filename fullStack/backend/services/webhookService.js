const axios = require('axios')
const jwt = require('jsonwebtoken')

const dispararPlan = async (userId, perfil) => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL

  if (!webhookUrl) {
    throw new Error('No está configurada la URL del webhook de n8n')
  }

  try {
    const payload = { userId, perfil }
    console.log('Enviando webhook a n8n:', webhookUrl)
    console.log('Payload n8n:', JSON.stringify(payload, null, 2))

    // generate a JWT for the webhook if a secret is available
    let webhookAuthHeader = {}
    try {
      if (process.env.JWT_SECRET) {
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '5m' })
        webhookAuthHeader = { Authorization: `Bearer ${token}` }
        console.log('Generado JWT para webhook (5m):', token.substring(0, 20) + '...')
      }
    } catch (e) {
      console.warn('No se pudo generar JWT para webhook:', e.message)
    }

    const respuesta = await axios.post(webhookUrl, payload, {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET,
        ...webhookAuthHeader
      }
    })

    console.log('Respuesta n8n:', respuesta.status, JSON.stringify(respuesta.data, null, 2))
    return respuesta.data
  } catch (error) {
    const detail = error.response?.data || error.message
    console.error('Error al llamar al webhook de n8n:', detail)
    if (error.response) {
      console.error('Status:', error.response.status, 'Headers:', error.response.headers)
    }
    throw new Error(`Fallo al invocar el webhook: ${JSON.stringify(detail)}`)
  }
}

module.exports = { dispararPlan }