const axios = require('axios')

const dispararPlan = async (userId, perfil) => {
    try {
        await axios.post(process.env.N8N_WEBHOOK_URL, {
            userId,
            perfil
        })
    } catch (err) {
        console.error('webhook N8N falló: ', err.message)
    }
}
module.exports = {dispararPlan}