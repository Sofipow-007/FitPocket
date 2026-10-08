const nodemailer = require('nodemailer')

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '')

// Sin SMTP configurado no se envía nada: el enlace sale por consola,
// que alcanza para desarrollo y para mostrar el flujo en una demo.
const smtpConfigurado = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

let transporter = null
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  }
  return transporter
}

const TEXTOS = {
  es: {
    asunto: 'Restablecé tu contraseña de FitPocket',
    saludo: 'Hola,',
    cuerpo: 'Recibimos un pedido para restablecer la contraseña de tu cuenta de FitPocket. Abrí este enlace para elegir una nueva:',
    boton: 'Elegir contraseña nueva',
    vence: (min) => `El enlace vence en ${min} minutos y se puede usar una sola vez.`,
    ignorar: 'Si no fuiste vos, ignorá este mail: tu contraseña no cambia.'
  },
  en: {
    asunto: 'Reset your FitPocket password',
    saludo: 'Hi,',
    cuerpo: 'We received a request to reset the password for your FitPocket account. Open this link to choose a new one:',
    boton: 'Choose a new password',
    vence: (min) => `The link expires in ${min} minutes and can only be used once.`,
    ignorar: "If this wasn't you, ignore this email: your password stays the same."
  }
}

const enviarMailDeReset = async ({ email, token, idioma, minutos }) => {
  const t = TEXTOS[idioma === 'en' ? 'en' : 'es']
  const enlace = `${FRONTEND_URL}/restablecer?token=${token}`

  if (!smtpConfigurado()) {
    console.log(`[mail] SMTP sin configurar. Enlace para restablecer la contraseña de ${email}:\n${enlace}`)
    return { enviado: false, enlace }
  }

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: t.asunto,
    text: `${t.saludo}\n\n${t.cuerpo}\n${enlace}\n\n${t.vence(minutos)}\n${t.ignorar}`,
    html: `<p>${t.saludo}</p><p>${t.cuerpo}</p><p><a href="${enlace}">${t.boton}</a></p><p>${t.vence(minutos)}<br>${t.ignorar}</p>`
  })
  return { enviado: true, enlace }
}

module.exports = { enviarMailDeReset }
